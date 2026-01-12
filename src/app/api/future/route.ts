import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStockPrice } from '@/lib/stockUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const holdings = await prisma.assetHolding.findMany({
            where: {
                asset: {
                    type: {
                        in: ['CRYPTO', 'STARTUP', 'COLLECTIBLE']
                    }
                }
            },
            include: {
                asset: true
            }
        });
        return NextResponse.json(holdings);
    } catch (error) {
        console.error("Error fetching future holdings:", error);
        return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ticker, type, quantity, price, date, name } = body;

        if (!ticker || !type || !quantity || !price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let normalizedTicker = ticker.toUpperCase();

        // Auto-fix common crypto tickers
        if (type === 'CRYPTO') {
            if (normalizedTicker === 'BTC') normalizedTicker = 'BTC-USD';
            if (normalizedTicker === 'ETH') normalizedTicker = 'ETH-USD';
            if (normalizedTicker === 'SOL') normalizedTicker = 'SOL-USD';
            if (normalizedTicker === 'DOGE') normalizedTicker = 'DOGE-USD';
            // Add more common ones if needed, or just rely on user typing it right if they know
        }

        // 1. Find or Create Asset
        let asset = await prisma.asset.findUnique({
            where: { ticker: normalizedTicker }
        });

        if (!asset) {
            const assetName = name || normalizedTicker;

            // Try to fetch price if it's CRYPTO
            let currentPrice = price; // Default to user price
            if (type === 'CRYPTO') {
                try {
                    const info = await getStockPrice(normalizedTicker);
                    if (info?.regularMarketPrice) currentPrice = info.regularMarketPrice;
                } catch (e) {
                    // ignore error
                }
            }

            asset = await prisma.asset.create({
                data: {
                    ticker: normalizedTicker,
                    name: assetName,
                    type: type,
                    currentPrice: Number(currentPrice),
                    lastPriceUpdate: new Date(),
                    riskLevel: body.riskLevel || 'HIGH',
                    vestingStart: body.vestingStart ? new Date(body.vestingStart) : null,
                    vestingMonths: body.vestingMonths ? Number(body.vestingMonths) : null,
                }
            });
        } else {
            // Update existing asset price if new transaction implies a fresher manual input or if we just want to ensure it's up to date
            // But usually we respect the latest fetch. If the user is manually adding, maybe they want to update the cached price?
            // Let's only update if the stored price is vastly different or old (simplifying: just update it to be safe if it's manual)
            if (type === 'STARTUP' || type === 'COLLECTIBLE') {
                await prisma.asset.update({
                    where: { id: asset.id },
                    data: { currentPrice: Number(price), lastPriceUpdate: new Date() }
                });
            }
        }

        // 2. Create Transaction
        const transaction = await prisma.assetTransaction.create({
            data: {
                assetId: asset.id,
                type: 'BUY',
                quantity: Number(quantity),
                pricePerUnit: Number(price),
                date: date ? new Date(date) : new Date(),
            }
        });

        // 3. Update Holding
        const holding = await prisma.assetHolding.findUnique({
            where: { assetId: asset.id }
        });

        if (holding) {
            const totalCost = (holding.quantity * holding.avgCost) + (Number(quantity) * Number(price));
            const newQuantity = holding.quantity + Number(quantity);
            const newAvgCost = totalCost / newQuantity;

            await prisma.assetHolding.update({
                where: { id: holding.id },
                data: {
                    quantity: newQuantity,
                    avgCost: newAvgCost
                }
            });
        } else {
            await prisma.assetHolding.create({
                data: {
                    assetId: asset.id,
                    quantity: Number(quantity),
                    avgCost: Number(price)
                }
            });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (error) {
        console.error("Error processing future transaction:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, quantity, avgCost, currentPrice, name } = body;
        // id is assetHoldingId or assetId? Let's assume holdingId for simplicity, or we can pass assetId.
        // Actually, the UI usually lists holdings. Let's look up by holding ID.

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        // Update Holding (Quantity / Avg Cost)
        if (quantity !== undefined || avgCost !== undefined) {
            await prisma.assetHolding.update({
                where: { id },
                data: {
                    ...(quantity !== undefined && { quantity: Number(quantity) }),
                    ...(avgCost !== undefined && { avgCost: Number(avgCost) }),
                }
            });
        }

        // Update Request might also want to update the underlying Asset (Price / Name)
        // We need to fetch the holding first to get the assetId
        const holding = await prisma.assetHolding.findUnique({
            where: { id },
            select: { assetId: true, quantity: true, avgCost: true }
        });

        if (holding && (currentPrice !== undefined || name !== undefined)) {
            await prisma.asset.update({
                where: { id: holding.assetId },
                data: {
                    ...(currentPrice !== undefined && { currentPrice: Number(currentPrice) }),
                    ...(name !== undefined && { name }),
                    ...(body.riskLevel !== undefined && { riskLevel: body.riskLevel }),
                    ...(body.vestingStart !== undefined && { vestingStart: new Date(body.vestingStart) }),
                    ...(body.vestingMonths !== undefined && { vestingMonths: Number(body.vestingMonths) }),
                }
            });
        }

        // SYNC TRANSACTIONS: If Quantity or AvgCost changed, we must update the transaction history
        // to ensure 'Total Invested' logic (which sums transactions) remains accurate.
        // Strategy: Collapse history into a single 'Buy' transaction reflecting the new state, preserving the original date.
        if (holding && (quantity !== undefined || avgCost !== undefined)) {
            const assetId = holding.assetId;
            // Get current 'truth' from payload or existing holding
            const finalQty = quantity !== undefined ? Number(quantity) : holding.quantity;
            const finalCost = avgCost !== undefined ? Number(avgCost) : holding.avgCost;

            // Find existing BUY transactions to get the earliest date
            const existingBuys = await prisma.assetTransaction.findMany({
                where: { assetId, type: 'BUY' },
                orderBy: { date: 'asc' }
            });

            // If no transactions exist (weird), use Now. If exist, use earliest.
            const originalDate = existingBuys.length > 0 ? existingBuys[0].date : new Date();

            // Delete old BUY transactions (to avoid double counting or stale data)
            await prisma.assetTransaction.deleteMany({
                where: { assetId, type: 'BUY' }
            });

            // Create Unified Transaction
            await prisma.assetTransaction.create({
                data: {
                    assetId,
                    type: 'BUY',
                    quantity: finalQty,
                    pricePerUnit: finalCost,
                    date: originalDate
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // With onDelete: Cascade in schema, this will automatically delete:
        // 1. Related AssetHolding
        // 2. Related AssetTransactions (fixing the 'ghost' investment issue)
        await prisma.asset.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting asset:", error);
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
