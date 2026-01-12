
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching allocations for schema 'future'...");
    const allocations = await prisma.allocation.findMany({
        where: {
            schemaId: 'future'
        },
        include: {
            transaction: true
        }
    });

    console.log(`Found ${allocations.length} allocations.`);
    allocations.forEach(a => {
        console.log(`\nAllocation ID: ${a.id}`);
        console.log(`  Amount: ${a.amount}`);
        console.log(`  Schema: ${a.schemaId}`);
        console.log(`  Tx Date: ${a.transaction.date}`);
        console.log(`  Tx Desc: ${a.transaction.description}`);
    });

    console.log("\nFetching all 'future' asset transactions...");
    const assetTransactions = await prisma.assetTransaction.findMany({
        orderBy: { date: 'desc' }
    });

    assetTransactions.forEach(t => {
        console.log(`\nAsset Tx ID: ${t.id}`);
        console.log(`  Type: ${t.type}`);
        console.log(`  Price: ${t.pricePerUnit}`);
        console.log(`  Qty: ${t.quantity}`);
        console.log(`  Total: ${t.pricePerUnit * t.quantity}`);
        console.log(`  Date: ${t.date}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
