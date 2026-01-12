import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function explainInvested() {
    // 1. Total Cash Invested (Transactions)
    const totalInvestedResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
    });
    const totalCashInvested = totalInvestedResult._sum.amount || 0;

    console.log(`\n=== 1. CASH FUNDING ===`);
    console.log(`Total Cash Added via Transactions: $${totalCashInvested.toLocaleString()}`);

    // 2. Future & Stocks Legacy Logic
    const allInvestmentAllocations = await prisma.allocation.findMany({
        where: { schemaId: { in: ['future', 'stocks'] } },
        include: { transaction: true }
    });

    const allInvestmentAssetTx = await prisma.assetTransaction.findMany({
        where: {
            type: 'BUY',
            asset: {
                type: {
                    in: ['CRYPTO', 'STARTUP', 'COLLECTIBLE', 'STOCK', 'ETF']
                }
            }
        },
        include: { asset: true }
    });

    // Merge events
    type FinancialEvent = {
        date: Date;
        amount: number;
        type: 'ALLOCATION' | 'BUY';
        details: string;
    };

    const events: FinancialEvent[] = [
        ...allInvestmentAllocations.map(a => ({
            date: new Date(a.transaction.date),
            amount: a.amount,
            type: 'ALLOCATION' as const,
            details: `Cash Funding (${a.schemaId})`
        })),
        ...allInvestmentAssetTx.map(t => ({
            date: new Date(t.date),
            amount: -(t.quantity * t.pricePerUnit),
            type: 'BUY' as const,
            details: `Buy ${t.quantity} ${t.asset.ticker} @ $${t.pricePerUnit}`
        }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Replay Logic with Debt Forgiveness
    let runningBalance = 0;
    let lastDebtTime: number | null = null;
    let totalForgivenDebt = 0;
    const DEBT_EXPIRY_MS = 60 * 60 * 1000; // 1 Hour

    // Track which assets contributed to the legacy/forgiven amount
    const legacyBreakdown: { name: string; amount: number; date: string }[] = [];

    console.log(`\n=== 2. LEGACY / SELF-FUNDED ASSETS ===`);
    console.log(`(Assets bought without sufficient cash balance, forgiven after 1 hour)`);

    for (const event of events) {
        // Check for debt expiry BEFORE processing new event
        if (runningBalance < 0 && lastDebtTime !== null) {
            const timeDiff = event.date.getTime() - lastDebtTime;
            if (timeDiff > DEBT_EXPIRY_MS) {
                const wipedAmount = Math.abs(runningBalance);
                // console.log(`   + $${wipedAmount.toLocaleString()} (Forgiven Debt) - Balance reset to 0 after ${(timeDiff/3600000).toFixed(1)}h wait.`);
                totalForgivenDebt += wipedAmount;
                runningBalance = 0;
                lastDebtTime = null;
            }
        }

        const prevBal = runningBalance;
        runningBalance += event.amount;

        // Log "Legacy/Debt" creation attribution
        if (event.type === 'BUY' && runningBalance < 0) {
            // How much of THIS transaction is debt?
            // If prevBal was positive (e.g. 100) and we spent 500. Debt is 400.
            // If prevBal was negative (e.g. -100) and we spent 200. Debt is 200.
            let debtContribution = 0;
            if (prevBal >= 0) {
                debtContribution = Math.abs(runningBalance);
            } else {
                debtContribution = Math.abs(event.amount);
            }

            legacyBreakdown.push({
                name: event.details,
                amount: debtContribution,
                date: event.date.toISOString()
            });
        }

        // Update debt timer
        if (runningBalance < 0) {
            if (lastDebtTime === null) {
                lastDebtTime = event.date.getTime();
                // console.log(`   [Debt Started] at ${event.date.toISOString()} due to ${event.details}`);
            }
        } else {
            lastDebtTime = null;
        }
    }

    // Check remaining debt? 
    if (runningBalance < 0) {
        // console.log(`   + $${Math.abs(runningBalance).toLocaleString()} (Active/Final Debt)`);
        totalForgivenDebt += Math.abs(runningBalance);
    }

    console.log(`\n--- Detailed Legacy Asset List ---`);
    legacyBreakdown.forEach(item => {
        console.log(`  • $${item.amount.toLocaleString().padEnd(10)} : ${item.name} (${item.date.split('T')[0]})`);
    });

    console.log(`\nTotal Legacy/Self-Funded Assets: $${totalForgivenDebt.toLocaleString()}`);

    const grandTotal = totalCashInvested + totalForgivenDebt;
    console.log(`\n=== TOTAL INVESTED BREAKDOWN ===`);
    console.log(`Total Cash Added:      $${totalCashInvested.toLocaleString()}`);
    console.log(`Total Legacy Assets:   $${totalForgivenDebt.toLocaleString()}`);
    console.log(`--------------------------------`);
    console.log(`GRAND TOTAL:           $${grandTotal.toLocaleString()}`);

}

explainInvested()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
