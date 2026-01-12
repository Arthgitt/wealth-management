import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getStockPrices } from '@/lib/stockUtils';

const prisma = new PrismaClient();

export async function POST() {
    try {
        const assets = await prisma.asset.findMany();
        const tickers = assets.map(a => a.ticker);

        if (tickers.length === 0) {
            return NextResponse.json({ message: "No assets to update" });
        }

        const quotes = await getStockPrices(tickers);

        let updatedCount = 0;
        for (const quote of quotes) {
            await prisma.asset.update({
                where: { ticker: quote.symbol },
                data: {
                    currentPrice: quote.regularMarketPrice,
                    lastPriceUpdate: new Date(),
                    name: quote.longName // Update name in case it changed or was missing
                }
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            total: tickers.length
        });

    } catch (error) {
        console.error("Error refreshing prices:", error);
        return NextResponse.json({ error: "Failed to refresh prices" }, { status: 500 });
    }
}
