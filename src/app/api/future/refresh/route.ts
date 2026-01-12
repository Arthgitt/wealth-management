import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStockPrice } from '@/lib/stockUtils';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log("Refreshing feature assets...");

        // Find all crypto assets
        const assets = await prisma.asset.findMany({
            where: {
                type: 'CRYPTO'
            }
        });

        let updatedCount = 0;

        await Promise.all(assets.map(async (asset) => {
            try {
                const info = await getStockPrice(asset.ticker);
                const price = info?.regularMarketPrice;

                if (price) {
                    await prisma.asset.update({
                        where: { id: asset.id },
                        data: {
                            currentPrice: price,
                            lastPriceUpdate: new Date()
                        }
                    });
                    updatedCount++;
                }
            } catch (error) {
                console.error(`Failed to update price for ${asset.ticker}`, error);
            }
        }));

        return NextResponse.json({ success: true, updated: updatedCount });

    } catch (error) {
        console.error("Error refreshing assets:", error);
        return NextResponse.json({ error: "Failed to refresh assets" }, { status: 500 });
    }
}
