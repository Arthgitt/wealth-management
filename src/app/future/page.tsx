"use client";

import { useFinanceStore } from "@/store/financeStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AddAssetDialog } from "@/components/future/AddAssetDialog";
import { EditAssetDialog } from "@/components/future/EditAssetDialog";
import Link from "next/link";

// Advanced Components
import { CrystalBall } from "@/components/future/CrystalBall";
import { RiskHeatmap } from "@/components/future/RiskHeatmap";
import { VestingTracker } from "@/components/future/VestingTracker";
import { SentimentGauge } from "@/components/future/SentimentGauge";
import { MoonLanding } from "@/components/future/MoonLanding";

export default function FuturePage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [stats, setStats] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetch('/api/future/refresh', { method: 'POST' });
            await fetchAssets();
            useFinanceStore.getState().fetchStats();
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const [assetsRes, statsRes] = await Promise.all([
                fetch('/api/future'),
                fetch('/api/stats')
            ]);

            const assetsData = await assetsRes.json();
            const statsData = await statsRes.json();

            if (Array.isArray(assetsData)) {
                setAssets(assetsData);
            }
            if (statsData.futureStats) {
                setStats(statsData.futureStats);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from your portfolio ? `)) return;

        try {
            const res = await fetch(`/ api / future ? id = ${id} `, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchAssets();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                <header>
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-sm mb-6 w-fit">
                        &larr; Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                        <Rocket className="w-6 h-6" />
                        <span className="text-sm uppercase tracking-widest font-semibold">Future Schema</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 mb-4">
                        Speculative & <br />
                        Long-Term Assets
                    </h1>
                    <p className="text-zinc-400 max-w-xl text-lg">
                        For the bets that could change everything. Track high-risk assets, startups, and collectibles separate from your core portfolio.
                    </p>

                    {stats && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-6 mt-6">
                            <div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Available Cash</div>
                                <div className="text-2xl font-mono text-white">${(stats.uninvestedCash || 0).toLocaleString()}</div>
                            </div>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-add-asset-dialog', { detail: { amount: stats.uninvestedCash?.toString() } }))}
                            >
                                Invest
                            </Button>
                        </div>
                    )}
                </header>

                {/* Moon Landing Monitor */}
                <MoonLanding assets={assets} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Asset List (wider) */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-zinc-200">Portfolio Holdings</CardTitle>
                                    <CardDescription>Your high-risk assets.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                    <AddAssetDialog onAssetAdded={fetchAssets} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-zinc-500 py-8 text-center animate-pulse">Loading assets...</div>
                                ) : assets.length === 0 ? (
                                    <div className="text-zinc-500 py-8 text-center text-sm border border-dashed border-zinc-800 rounded">
                                        No speculative assets found. Start by adding one.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {assets.map((holding) => (
                                            <div key={holding.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-purple-500/30 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                                                        {holding.asset.ticker.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-zinc-200">{holding.asset.name}</div>
                                                        <div className="text-xs text-zinc-500 flex gap-2">
                                                            <span>{holding.asset.type}</span>
                                                            <span className="text-zinc-600">•</span>
                                                            <span>{holding.quantity} {holding.asset.type === 'CRYPTO' ? 'Coins' : 'Units'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="font-mono text-zinc-200">
                                                            ${(holding.quantity * (holding.asset.currentPrice || holding.avgCost)).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">
                                                            Avg Cost: ${holding.avgCost.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <EditAssetDialog holding={holding} onUpdate={fetchAssets} />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => handleDelete(holding.id, holding.asset.name)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Vesting Tracker (Only shows if there are vesting assets) */}
                        <VestingTracker assets={assets} />
                    </div>

                    {/* Right Column: Analytics & Simulators */}
                    <div className="space-y-8">
                        <SentimentGauge />
                        <CrystalBall />
                        <RiskHeatmap assets={assets} />
                    </div>
                </div>
            </div>
        </div>
    );
}

