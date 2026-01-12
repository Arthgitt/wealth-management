import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('API Hit: /api/stats');
    console.log('Prisma keys:', Object.keys(prisma));
    // console.log('Prisma Expense keys:', prisma.expense ? Object.keys(prisma.expense) : 'Undefined');

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const dateFilter = dateParam ? {
        date: {
            gte: new Date(`${dateParam}T00:00:00.000`),
            lte: new Date(`${dateParam}T23:59:59.999`)
        }
    } : {};

    try {
        // 1. Total Invested: Sum of all transaction amounts up to date
        const totalInvestedResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: dateFilter,
        });
        const totalInvested = totalInvestedResult._sum.amount || 0;

        // 2. Allocations: Group by schemaId
        // Note: Prisma currently doesn't support easy "groupBy" with "sum" on relation filters in a single query easily 
        // depending on the provider, so we might fetch allocations directly.

        // 3. Allocations: Group by schemaId
        // We filter allocations based on their parent transaction's date
        const allocations = await prisma.allocation.findMany({
            where: {
                transaction: {
                    ...dateFilter
                }
            },
            include: { transaction: true } // Need date for legacy cutoff logic
        });

        // 3. Total Expenses: Sum of all expenses
        const totalExpensesResult = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: dateFilter,
        });
        const totalExpenses = totalExpensesResult._sum.amount || 0;

        const schemaAllocations: Record<string, number> = {};
        let totalNetWorth = 0;

        allocations.forEach(alloc => {
            schemaAllocations[alloc.schemaId] = (schemaAllocations[alloc.schemaId] || 0) + alloc.amount;
            totalNetWorth += alloc.amount; // Add to Net Worth initially
        });

        // Subtract expenses from Net Worth
        totalNetWorth -= totalExpenses;

        // Subtract expenses from the 'expenses' schema allocation to show "Remaining"
        // 'expenses' is the ID defined in schemas/expenses.tsx
        if (schemaAllocations['expenses']) {
            schemaAllocations['expenses'] -= totalExpenses;
        }

        // 4. Future Schema Logic
        // Calculate Uninvested Cash = (Total Allocated to Future) - (New Spending on Future Assets)

        // --- NEW START: Running Balance Logic (Global for Investments) ---

        // Fetch ALL Allocations for Investing (Future + Stocks)
        // We combine them to separate "Spending" (Expenses/Savings) from "Investing" (Future/Stocks).
        // This allows fungibility between Stocks and Future cash if desired, or at least tracks them together.

        const historyFilter = dateParam ? {
            date: { lte: new Date(`${dateParam}T23:59:59.999`) }
        } : {};

        const allInvestmentAllocations = await prisma.allocation.findMany({
            where: {
                schemaId: { in: ['future', 'stocks'] },
                transaction: historyFilter
            },
            include: { transaction: true }
        });

        // Fetch ALL Asset Transactions for Investment-type assets (Crypto, Stocks, etc)
        const allInvestmentAssetTx = await prisma.assetTransaction.findMany({
            where: {
                type: 'BUY',
                asset: {
                    type: {
                        in: ['CRYPTO', 'STARTUP', 'COLLECTIBLE', 'STOCK', 'ETF']
                    }
                },
                ...historyFilter
            },
            include: { asset: true }
        });

        // Merge events
        type FinancialEvent = {
            date: Date;
            amount: number; // Positive for Allocation, Negative for Buy
            type: 'ALLOCATION' | 'BUY';
        };

        const events: FinancialEvent[] = [
            ...allInvestmentAllocations.map(a => ({
                date: new Date(a.transaction.date),
                amount: a.amount,
                type: 'ALLOCATION' as const
            })),
            ...allInvestmentAssetTx.map(t => ({
                date: new Date(t.date),
                amount: -(t.quantity * t.pricePerUnit),
                type: 'BUY' as const
            }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Replay Logic with Debt Forgiveness
        let runningBalance = 0;
        let lastDebtTime: number | null = null;
        let totalForgivenDebt = 0; // Track how much "Legacy Cost" we implicitly paid for
        const DEBT_EXPIRY_MS = 60 * 60 * 1000; // 1 Hour

        for (const event of events) {
            // Check for debt expiry BEFORE processing new event
            if (runningBalance < 0 && lastDebtTime !== null) {
                if (event.date.getTime() - lastDebtTime > DEBT_EXPIRY_MS) {
                    // Debt is stale (Legacy asset buy not funded immediately), wipe it
                    // The amount wiped (negative balance) represents the cost we "forgive" / assume paid externally
                    totalForgivenDebt += Math.abs(runningBalance);

                    runningBalance = 0;
                    lastDebtTime = null;
                }
            }

            runningBalance += event.amount;

            // Update debt timer
            if (runningBalance < 0) {
                if (lastDebtTime === null) {
                    lastDebtTime = event.date.getTime();
                }
            } else {
                lastDebtTime = null; // Debt cleared
            }
        }

        // If there is remaining negative balance at the end (current debt), should we count it?
        // Probably not yet, as it's active debt. But user asked for "Invested Money". 
        // If I buy $50k BTC and have -$50k balance, I HAVE invested $50k.
        // So effectively, Total Invested = (Allocations) + (Forgiven Legacy Costs) + (Current Active Debt if any)
        // Actually simplest: Total Invested = (Allocations) + (Total Cost of Allocations-less Assets)

        // Let's stick to adding 'totalForgivenDebt'. 
        // What about current negative balance? If I just bought it, it's debt. 
        // If I count it as invested, I should.

        if (runningBalance < 0) {
            totalForgivenDebt += Math.abs(runningBalance);
            // We don't reset runningBalance here for the UI (it shows negative cash?), 
            // but strictly for "Total Invested" stat, this money is "Invested".
        }

        // Global Uninvested (Stocks + Future)
        const globalUninvestedCash = Math.max(0, runningBalance);
        // For now, we report this as Future Cash (assuming fungible), or we could split it.
        const futureUninvestedCash = globalUninvestedCash;

        // Calculate legacy-compatible variables for Net Worth logic
        const futureAllocations = allocations.filter(a => a.schemaId === 'future');
        // Or if we want to use the ALL history version:
        const futureAllocated = allInvestmentAllocations
            .filter(a => a.schemaId === 'future')
            .reduce((sum, a) => sum + a.amount, 0);

        // Calculate Current Asset Valuation (for Net Worth)
        // We need existing holdings to get current value
        const holdings = await prisma.assetHolding.findMany({
            include: { asset: true }
        });

        let futureAssetValue = 0;
        holdings.forEach(h => {
            // Use currentPrice if available, otherwise avgCost
            const price = h.asset.currentPrice || h.avgCost;
            futureAssetValue += h.quantity * price;
        });

        // Update Allocations Object for UI
        schemaAllocations['future'] = futureUninvestedCash + futureAssetValue;

        // RE-CALCULATE NET WORTH to be accurate
        // Net Worth = (Total Allocations - Future Allocation) + Future Uninvested + Future Assets - Expenses

        // Remove raw allocation amount from net worth
        totalNetWorth -= futureAllocated;
        // Add back the real value (Cash + Market Value of Assets)
        totalNetWorth += (futureUninvestedCash + futureAssetValue);

        // Add the "Legacy" (unfunded) investment cost to the Global Total Invested
        // global 'totalInvested' currently only sums Transaction (cash).
        // unique addition for Future schema users who import assets.
        const finalTotalInvested = totalInvested + totalForgivenDebt;

        // Check if we need to do this for Stocks too?
        // Stocks don't have this 'running balance' logic yet. 
        // Assuming Stocks works on direct allocation = cost? 
        // Users usually track stocks by adding money to 'Stocks' schema then buying.
        // If they bypass that, we miss it. But let's fix Future first.

        return NextResponse.json({
            totalInvested: finalTotalInvested,
            totalNetWorth,
            totalExpenses,
            allocations: schemaAllocations,
            futureStats: {
                allocated: allInvestmentAllocations.filter(a => a.schemaId === 'future').reduce((sum, a) => sum + a.amount, 0),
                investedCost: allInvestmentAssetTx
                    .filter(t => ['CRYPTO', 'STARTUP', 'COLLECTIBLE'].includes(t.asset.type))
                    .reduce((sum, t) => sum + (t.quantity * t.pricePerUnit), 0),
                uninvestedCash: futureUninvestedCash,
                assetValue: futureAssetValue
            }
        });

    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
