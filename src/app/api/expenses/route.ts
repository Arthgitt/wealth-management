import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, description, date, categoryId, newCategoryName } = body;

        let finalCategoryId = categoryId;

        // Handle new category creation on the fly if needed
        if (newCategoryName) {
            const cat = await prisma.category.create({
                data: { name: newCategoryName }
            });
            finalCategoryId = cat.id;
        }

        if (!finalCategoryId) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        // Description Normalization Logic
        let finalDescription = description.trim();
        const isQuoted = (finalDescription.startsWith('"') && finalDescription.endsWith('"')) ||
            (finalDescription.startsWith("'") && finalDescription.endsWith("'"));

        if (isQuoted) {
            // Remove quotes and keep as is
            finalDescription = finalDescription.slice(1, -1);
        } else {
            // Title Case
            finalDescription = finalDescription.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase());
        }

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                description: finalDescription,
                date: new Date(date), // Expecting ISO string
                categoryId: finalCategoryId
            }
        });

        return NextResponse.json(expense);

    } catch (error) {
        console.error("Failed to create expense:", error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const dateFilter = dateParam ? {
        date: {
            lte: new Date(dateParam + 'T23:59:59.999Z'),
            gte: new Date(dateParam + 'T00:00:00.000Z') // If we want specific day, or just LTE? 
            // Previous stats logic used LTE for accumulating, but for expenses list usually we want "Month" or "All" or "Day".
            // Let's assume for now we return all unless filtered by month/day. 
            // The user asked for "show all that into dashboard", implying recent or all.
            // Let's implement basics: return recent 50 by default if no filter.
        }
    } : {};

    try {
        console.log("Fetching expenses with filter:", dateFilter);
        const expenses = await prisma.expense.findMany({
            where: dateFilter,
            orderBy: { date: 'desc' },
            take: 50,
            include: { category: true }
        });
        console.log(`Fetched ${expenses.length} expenses`);
        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}
