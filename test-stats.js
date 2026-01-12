const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const dateParam = null; // Simulate no date filter
    const dateFilter = dateParam ? {
        createdAt: {
            lte: new Date(dateParam + 'T23:59:59.999Z')
        }
    } : {};

    console.log('Date Filter:', dateFilter);

    // 1. Total Invested
    const totalInvestedResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: dateFilter,
    });
    const totalInvested = totalInvestedResult._sum.amount || 0;
    console.log('Total Invested:', totalInvested);

    // 2. Allocations
    const allocations = await prisma.allocation.findMany({
        where: {
            transaction: {
                ...dateFilter
            }
        }
    });
    console.log(`Found ${allocations.length} allocations`);

    // 3. Total Expenses
    const totalExpensesResult = await prisma.expense.aggregate({
        _sum: { amount: true },
        where: dateFilter,
    });
    const totalExpenses = totalExpensesResult._sum.amount || 0;
    console.log('Total Expenses:', totalExpenses);

    const schemaAllocations = {};
    let totalNetWorth = 0;

    allocations.forEach(alloc => {
        schemaAllocations[alloc.schemaId] = (schemaAllocations[alloc.schemaId] || 0) + alloc.amount;
        totalNetWorth += alloc.amount;
    });
    console.log('Initial Net Worth:', totalNetWorth);

    totalNetWorth -= totalExpenses;
    console.log('Final Net Worth:', totalNetWorth);

    if (schemaAllocations['expenses']) {
        console.log('Initial Expenses Allocation:', schemaAllocations['expenses']);
        schemaAllocations['expenses'] -= totalExpenses;
        console.log('Final Expenses Allocation:', schemaAllocations['expenses']);
    } else {
        console.log('No expenses allocation found in map:', Object.keys(schemaAllocations));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
