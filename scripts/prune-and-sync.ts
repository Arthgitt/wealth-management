
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixData() {
    console.log("=== STARTING DATA CLEANUP ===");

    // 1. DELETE GHOST ASSETS (Assets with no Holding)
    // These are assets users "deleted" in the UI (which removed the Holding)
    // but the Asset + Transactions remained in the DB.
    const allAssets = await prisma.asset.findMany({
        include: { holding: true, transactions: true }
    });

    console.log(`Found ${allAssets.length} total assets in DB.`);

    let deletedGhosts = 0;
    for (const asset of allAssets) {
        if (!asset.holding) {
            console.log(`🗑️  Deleting Ghost Asset: ${asset.ticker} (${asset.name}) - Had ${asset.transactions.length} transactions`);
            // This delete will CASCADE to transactions
            await prisma.asset.delete({ where: { id: asset.id } });
            deletedGhosts++;
        }
    }
    console.log(`✅ Deleted ${deletedGhosts} Ghost Assets.\n`);

    // 2. SYNC ACTIVE ASSETS
    // Ensure Transaction History matches the active Holding state (WYSIWYG)
    const activeHoldings = await prisma.assetHolding.findMany({
        include: { asset: true }
    });

    console.log(`=== SYNCING ${activeHoldings.length} ACTIVE HOLDINGS ===`);

    for (const h of activeHoldings) {
        const totalCost = h.quantity * h.avgCost;
        console.log(`🔄 Syncing ${h.asset.ticker}: ${h.quantity} units @ $${h.avgCost} (Total: $${totalCost})`);

        // Find existing transactions to preserve the earliest 'Date' (optional, but nice for 'Legacy' status)
        const txs = await prisma.assetTransaction.findMany({
            where: { assetId: h.assetId, type: 'BUY' },
            orderBy: { date: 'asc' }
        });

        // Use oldest date or now
        const originalDate = txs.length > 0 ? txs[0].date : new Date();

        // DELETE ALL HISTORY
        const { count } = await prisma.assetTransaction.deleteMany({
            where: { assetId: h.assetId }
        });

        // CREATE SINGLE TRUTH TRANSACTION
        await prisma.assetTransaction.create({
            data: {
                assetId: h.assetId,
                type: 'BUY',
                quantity: h.quantity,
                pricePerUnit: h.avgCost,
                date: originalDate
            }
        });

        console.log(`   - Replaced ${count} txs with 1 consolidated entry.`);
    }

    console.log("\n=== CLEANUP COMPLETE ===");
}

fixData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
