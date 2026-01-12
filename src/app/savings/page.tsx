"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PiggyBank } from 'lucide-react';
import { SavingsDashboard } from '@/components/SavingsDashboard';
import { SavingsGrowthChart } from '@/components/savings/SavingsGrowthChart';

export default function SavingsPage() {
    return (
        <main className="min-h-screen bg-zinc-950 p-6 md:p-12 text-zinc-100 font-sans selection:bg-indigo-500/30">
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
                                <PiggyBank className="w-8 h-8 text-emerald-500" />
                                Savings
                            </h1>
                            <p className="text-zinc-500">Track your goals and liquid assets</p>
                        </div>
                    </div>
                </header>

                {/* Content (Dashboard) */}
                <section>
                    <SavingsGrowthChart />
                    <SavingsDashboard />
                </section>
            </div>
        </main>
    );
}
