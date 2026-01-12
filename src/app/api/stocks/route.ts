import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getStockPrice } from '@/lib/stockUtils';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const holdings = await prisma.assetHolding.findMany({
            where: {
                asset: {
                    type: {
                        in: ['STOCK', 'ETF']
                    }
                }
            },
            include: {
                asset: true
            }
        });
        return NextResponse.json(holdings);
    } catch (error) {
        console.error("Error fetching holdings:", error);
        return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ticker, type, quantity, price, date } = body;

        if (!ticker || !type || !quantity || !price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedTicker = ticker.toUpperCase();

        // 1. Find or Create Asset
        let asset = await prisma.asset.findUnique({
            where: { ticker: normalizedTicker }
        });

        if (!asset) {
            // Try to fetch name from Yahoo first? Or just create with ticker as name
            const info = await getStockPrice(normalizedTicker);
            asset = await prisma.asset.create({
                data: {
                    ticker: normalizedTicker,
                    name: info?.longName || normalizedTicker,
                    currentPrice: info?.regularMarketPrice || price, // Use transaction price if yahoo fails
                    lastPriceUpdate: new Date(),
                }
            });
        }

        // 2. Create Transaction
        const transaction = await prisma.assetTransaction.create({
            data: {
                assetId: asset.id,
                type,
                quantity: Number(quantity),
                pricePerUnit: Number(price),
                date: date ? new Date(date) : new Date(),
            }
        });

        // 3. Update Holding
        const holding = await prisma.assetHolding.findUnique({
            where: { assetId: asset.id }
        });

        if (type === 'BUY') {
            if (holding) {
                // Weighted Average Cost
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
        } else if (type === 'SELL') {
            if (!holding || holding.quantity < quantity) {
                return NextResponse.json({ error: "Insufficient holdings to sell" }, { status: 400 });
            }

            const newQuantity = holding.quantity - Number(quantity);
            // Avg Cost doesn't change on sell usually, unless FIFO/LIFO tracking, but for simple weighted avg it stays same

            if (newQuantity === 0) {
                await prisma.assetHolding.delete({
                    where: { id: holding.id }
                });
            } else {
                await prisma.assetHolding.update({
                    where: { id: holding.id },
                    data: {
                        quantity: newQuantity,
                        // avgCost stays same
                    }
                });
            }
        }

        return NextResponse.json({ success: true, transaction });

    } catch (error) {
        console.error("Error processing stock transaction:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
