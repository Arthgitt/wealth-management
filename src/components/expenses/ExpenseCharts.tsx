"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

// Consistent colors
const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string; // ISO
    categoryId: string;
    category: {
        name: string;
    }
}

interface ExpenseChartsProps {
    expenses: Expense[];
}

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {

    // 1. Prepare Pie Chart Data (by Category)
    const pieData = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        expenses.forEach(exp => {
            const catName = exp.category?.name || 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    // 2. Prepare Bar Chart Data (Daily Spending - Last 7 days or all provided?)
    // Let's accumulate by Date (YYYY-MM-DD)
    const barData = useMemo(() => {
        const dateMap: Record<string, number> = {};
        expenses.forEach(exp => {
            const dateKey = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dateMap[dateKey] = (dateMap[dateKey] || 0) + exp.amount;
        });
        // Sort by date ideally, but map keys might be unordered. 
        // For simplicity, let's just take the entries and reverse them if expenses are desc.
        // If expenses are sorted desc (newest first), we want bar chart left-to-right (oldest -> newest).
        return Object.entries(dateMap)
            .map(([name, value]) => ({ name, value }))
            .reverse();
    }, [expenses]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Daily Spending</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                itemStyle={{ color: '#e4e4e7' }}
                                cursor={{ fill: '#27272a' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
