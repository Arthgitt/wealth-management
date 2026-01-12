"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

export function CrystalBall() {
    const [investment, setInvestment] = useState(1000);
    const [multiple, setMultiple] = useState(10);
    const [taxRate, setTaxRate] = useState(20);

    const grossReturn = investment * multiple;
    const taxAmount = (grossReturn - investment) * (taxRate / 100);
    const netReturn = grossReturn - taxAmount;

    return (
        <Card className="bg-zinc-950/50 border-purple-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                    <span className="text-2xl">🔮</span> Crystal Ball Simulator
                </CardTitle>
                <CardDescription>Visualize your exit strategy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Current Investment</span>
                        <span className="font-mono text-zinc-200">${investment.toLocaleString()}</span>
                    </div>
                    <Slider
                        value={[investment]}
                        min={100} max={100000} step={100}
                        onValueChange={([v]) => setInvestment(v)}
                        className="py-1"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Hypothetical Multiple (X)</span>
                        <span className="font-mono text-purple-400">{multiple}x</span>
                    </div>
                    <Slider
                        value={[multiple]}
                        min={1} max={100} step={1}
                        onValueChange={([v]) => setMultiple(v)}
                        className="py-1"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Tax Rate (%)</span>
                        <span className="font-mono text-red-400">{taxRate}%</span>
                    </div>
                    <Slider
                        value={[taxRate]}
                        min={0} max={50} step={1}
                        onValueChange={([v]) => setTaxRate(v)}
                        className="py-1"
                    />
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Projected Net Value</span>
                        <motion.div
                            key={netReturn}
                            initial={{ scale: 1.2, color: "#fff" }}
                            animate={{ scale: 1, color: "#d8b4fe" }}
                            className="text-3xl font-bold font-mono"
                        >
                            ${Math.round(netReturn).toLocaleString()}
                        </motion.div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Tax: ${Math.round(taxAmount).toLocaleString()}</span>
                        <span>Gross: ${grossReturn.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
