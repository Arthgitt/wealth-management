"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

interface Asset {
    id: string;
    ticker: string;
    vestingStart: string | Date | null;
    vestingMonths: number | null;
    name: string;
}

interface Holding {
    asset: Asset;
    quantity: number;
    avgCost: number;
}

export function VestingTracker({ assets }: { assets: Holding[] }) {
    // Filter for assets with vesting data
    const vestingAssets = assets.filter(
        h => h.asset.vestingStart && h.asset.vestingMonths
    );

    if (vestingAssets.length === 0) return null;

    const calculateVesting = (start: Date, months: number) => {
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);

        const totalTime = endDate.getTime() - startDate.getTime();
        const elapsedTime = now.getTime() - startDate.getTime();

        const percentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
        return { percentage, endDate };
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-zinc-200">⏳ Vesting Schedules</CardTitle>
                <CardDescription>Track your equity unlock timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {vestingAssets.map(holding => {
                    const { percentage, endDate } = calculateVesting(
                        new Date(holding.asset.vestingStart!),
                        holding.asset.vestingMonths!
                    );

                    return (
                        <div key={holding.asset.id} className="space-y-2">
                            <div className="flex justify-between text-sm text-zinc-300">
                                <span className="font-medium">{holding.asset.name}</span>
                                <span>{percentage.toFixed(1)}% Vested</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Started: {format(new Date(holding.asset.vestingStart!), 'MMM yyyy')}</span>
                                <span>{percentage === 100 ? 'Fully Vested' : `Unlocks: ${format(endDate, 'MMM yyyy')}`}</span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
