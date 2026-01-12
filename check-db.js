const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Transactions ---');
    const transactions = await prisma.transaction.findMany({
        include: { allocations: true }
    });
    console.log(JSON.stringify(transactions, null, 2));

    console.log('\n--- Allocations ---');
    const allocations = await prisma.allocation.findMany();
    console.log(JSON.stringify(allocations, null, 2));

    console.log('\n--- Expenses ---');
    const expenses = await prisma.expense.findMany();
    console.log(JSON.stringify(expenses, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
