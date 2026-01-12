"use client";

import { useEffect, useState } from 'react';
import { useFinanceStore } from '@/store/financeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { ExpenseCharts } from '@/components/expenses/ExpenseCharts';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { format } from 'date-fns';

interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string;
    categoryId: string;
    category: {
        name: string;
    }
}

export default function ExpensesPage() {
    // We can reuse financeStore for global stats (like total allocated to expenses)
    // But we need to fetch specific expenses list here.
    const { fetchStats, allocations } = useFinanceStore();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // This is the "Remaining Budget" for expenses as calculated by the stats API (allocated - spent)
    const expenseBudgetRemaining = allocations['expenses'] || 0;

    // We might want to know total allocated original amount for expenses to show progress?
    // Current API subtracts expenses from alloc['expenses'].
    // totalExpenses return from stats API would be useful.
    const [totalSpent, setTotalSpent] = useState(0);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch global stats to get updated budget remaining
            await fetchStats();

            // Fetch expenses list
            const res = await fetch('/api/expenses');
            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                setExpenses(data);
                const spent = data.reduce((acc: number, curr: Expense) => acc + curr.amount, 0);
                setTotalSpent(spent);
            } else {
                console.error("Failed to fetch expenses or invalid format", data);
                setExpenses([]);
                setTotalSpent(0);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <main className="min-h-screen bg-zinc-950 p-6 md:p-12 text-zinc-100 font-sans selection:bg-red-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                                <CreditCard className="w-8 h-8 text-red-500" />
                                Expenses
                            </h1>
                            <p className="text-zinc-500">Manage and analyze your spending</p>
                        </div>
                    </div>
                    <AddExpenseDialog onExpenseAdded={loadData} />
                </header>

                {/* Summary Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Budget Remaining</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">${expenseBudgetRemaining.toFixed(2)}</div>
                            <p className="text-xs text-zinc-500 mt-1">From allocated funds</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Daily Average</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-400">
                                {/* Simple avg for now, typically count days since first expense or current month */}
                                ${expenses.length > 0 ? (totalSpent / 30).toFixed(2) : '0.00'}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Est. over 30 days</p>
                        </CardContent>
                    </Card>
                </section>

                {/* Analysis */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Analysis</h2>
                    <ExpenseCharts expenses={expenses} />
                </section>

                {/* Recent Transactions Table */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                    <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Description</th>
                                        <th className="px-6 py-3 font-medium">Category</th>
                                        <th className="px-6 py-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                                No expenses recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 text-zinc-300 whitespace-nowrap">
                                                    {format(new Date(expense.date), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {expense.description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                        {expense.category?.name || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-red-400">
                                                    -${expense.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
