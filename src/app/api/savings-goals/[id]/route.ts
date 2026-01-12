import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log("Details API Hit, ID:", id);

        const goal = await prisma.savingsGoal.findUnique({
            where: { id },
            include: {
                allocations: {
                    include: {
                        transaction: true
                    },
                    orderBy: {
                        transaction: {
                            date: 'desc'
                        }
                    }
                }
            }
        });

        if (!goal) {
            console.log("Goal not found for id:", id);
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        // Dynamically calculate currentAmount from allocations
        const currentAmount = goal.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

        return NextResponse.json({
            ...goal,
            currentAmount
        });
    } catch (error: any) {
        console.error("Failed to fetch goal details FULL ERROR:", error);
        return NextResponse.json({ error: 'Failed to fetch goal', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        await prisma.savingsGoal.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete goal", error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
