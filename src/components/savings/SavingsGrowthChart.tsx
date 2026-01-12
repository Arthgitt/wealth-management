"use client";

import { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    date: string;
    allocations: {
        schemaId: string;
        amount: number;
    }[];
}

export function SavingsGrowthChart() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/transactions?schemaId=savings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // The API returns transactions where at least one allocation matches.
                    // We need to verify we only sum the 'savings' part if a transaction split schemas.
                    setTransactions(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const chartData = useMemo(() => {
        if (transactions.length === 0) return [];

        // 1. Flatten into daily net changes for 'savings'
        const dailyChanges: Record<string, number> = {};

        transactions.forEach(tx => {
            const dateStr = new Date(tx.date).toISOString().split('T')[0];
            const savingsAlloc = tx.allocations.find(a => a.schemaId === 'savings');
            if (savingsAlloc) {
                dailyChanges[dateStr] = (dailyChanges[dateStr] || 0) + savingsAlloc.amount;
            }
        });

        // 2. Sort dates
        const sortedDates = Object.keys(dailyChanges).sort();

        // 3. Compute running total
        let runningTotal = 0;
        const data = sortedDates.map(date => {
            runningTotal += dailyChanges[date];
            return {
                date: format(new Date(date), 'MMM d'),
                fullDate: date,
                amount: runningTotal
            };
        });

        return data;
    }, [transactions]);

    if (loading) return <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;
    if (chartData.length === 0) return null;

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 mb-8">
            <CardHeader>
                <CardTitle className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Total Savings Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                            itemStyle={{ color: '#10b981' }}
                            cursor={{ stroke: '#27272a' }}
                            formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, 'Total Saved']}
                            labelFormatter={(label) => label}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorSavings)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
