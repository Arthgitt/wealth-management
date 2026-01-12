"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Asset {
    id: string;
    ticker: string;
    riskLevel: string; // LOW, MEDIUM, HIGH, EXTREME
    currentPrice: number;
}

interface Holding {
    asset: Asset;
    quantity: number;
}

export function RiskHeatmap({ assets }: { assets: Holding[] }) {
    // Group totals by risk level
    const riskTotals = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        EXTREME: 0
    };

    assets.forEach(h => {
        const value = h.quantity * h.asset.currentPrice;
        const level = h.asset.riskLevel as keyof typeof riskTotals || 'HIGH';
        if (riskTotals[level] !== undefined) {
            riskTotals[level] += value;
        }
    });

    const totalValue = Object.values(riskTotals).reduce((a, b) => a + b, 0) || 1;

    const getWidth = (val: number) => {
        return Math.max(5, (val / totalValue) * 100) + '%';
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-zinc-200">Risk Exposure</CardTitle>
                <CardDescription>Where is your capital concentrated?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Low Risk</span>
                            <span>${riskTotals.LOW.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: getWidth(riskTotals.LOW) }} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Medium Risk</span>
                            <span>${riskTotals.MEDIUM.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: getWidth(riskTotals.MEDIUM) }} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>High Risk (Crypto/Stocks)</span>
                            <span>${riskTotals.HIGH.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: getWidth(riskTotals.HIGH) }} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Extreme Risk (Moonshots)</span>
                            <span>${riskTotals.EXTREME.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 shimmer" style={{ width: getWidth(riskTotals.EXTREME) }} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
