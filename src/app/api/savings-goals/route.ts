import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET() {
    try {
        const goals = await prisma.savingsGoal.findMany({
            include: {
                allocations: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // We can compute currentAmount if needed, but we have a field for it.
        // However, the currentAmount should ideally be the sum of allocations.
        // Let's re-calculate it on the fly to be safe or rely on the field if we maintain it well.
        // For now, let's sum allocations to be accurate.
        const goalsWithProgress = goals.map(goal => ({
            ...goal,
            currentAmount: goal.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
        }));

        return NextResponse.json(goalsWithProgress);
    } catch (error) {
        console.error('Error fetching savings goals:', error);
        return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, targetAmount, deadline, color } = body;

        if (!name || !targetAmount) {
            return NextResponse.json({ error: 'Name and target amount are required' }, { status: 400 });
        }

        const goal = await prisma.savingsGoal.create({
            data: {
                name,
                targetAmount: parseFloat(targetAmount),
                deadline: deadline ? new Date(deadline) : null,
                color: color || '#10B981',
            }
        });

        return NextResponse.json(goal);
    } catch (error: any) {
        console.error('Error creating savings goal:', error);
        return NextResponse.json({ error: error.message || 'Failed to create savings goal' }, { status: 500 });
    }
}
