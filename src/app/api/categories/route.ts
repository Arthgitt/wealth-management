import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
        }

        const normalizedName = name.trim();

        // Check if exists (case-insensitive check could be good, but schema enforces unique name which is usually case-sensitive in SQL, but for UX we just rely on unique constraint or simple check)
        // For now, let's just try create and catch error, or findFirst.

        const category = await prisma.category.create({
            data: { name: normalizedName }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
