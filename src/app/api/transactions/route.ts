import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, date, allocations } = body;
        // allocations is { "savings": 500, "stocks": 500 }

        if (!amount || !allocations) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                date: new Date(date),
                createdAt: new Date(), // Tracking when it was added vs the effective date
                allocations: {
                    create: Array.isArray(allocations)
                        ? allocations.map((alloc: any) => ({
                            schemaId: alloc.schemaId,
                            amount: Number(alloc.amount),
                            savingsGoalId: alloc.savingsGoalId || null
                        }))
                        : Object.entries(allocations).map(([schemaId, allocatedAmount]) => ({
                            schemaId,
                            amount: Number(allocatedAmount)
                        }))
                }
            },
            include: {
                allocations: true
            }
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Transaction Error:", error);
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const transactions = await prisma.transaction.findMany({
        include: { allocations: true },
        orderBy: { date: 'desc' },
        take: 20
    });
    return NextResponse.json(transactions);
}
