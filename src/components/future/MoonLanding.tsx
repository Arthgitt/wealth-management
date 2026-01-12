"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface MoonLandingProps {
    assets: any[];
}

export function MoonLanding({ assets }: MoonLandingProps) {
    const totalValue = assets.reduce((acc, h) => {
        return acc + (h.quantity * (h.asset.currentPrice || h.avgCost));
    }, 0);

    const target = 1000000; // $1M Goal
    const progress = Math.min(100, Math.max(0, (totalValue / target) * 100));

    return (
        <Card className="bg-zinc-950 border-purple-500/30 overflow-hidden relative">
            {/* Starry Background Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <CardHeader className="relative z-10">
                <CardTitle className="text-zinc-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">🚀 Moon Landing</span>
                    <span className="font-mono text-purple-400 text-lg">${totalValue.toLocaleString()} / $1M</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
                <div className="h-4 bg-zinc-900 rounded-full border border-zinc-800 relative overflow-visible">
                    {/* Progress Fill */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-900 via-purple-600 to-pink-500 rounded-full relative"
                    >
                        {/* Rocket Icon at the tip */}
                        <div className="absolute -right-3 -top-3 p-1 bg-zinc-950 rounded-full border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                            <Rocket className="w-4 h-4 text-white transform rotate-45" />
                        </div>
                    </motion.div>
                </div>

                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                    <span>Launchpad ($0)</span>
                    <span>Orbit ($100k)</span>
                    <span>Moon ($1M)</span>
                </div>
            </CardContent>
        </Card>
    );
}
