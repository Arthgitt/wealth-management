"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

export function SentimentGauge() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSentiment = async () => {
            try {
                const res = await fetch("https://api.alternative.me/fng/?limit=1");
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    setData(json.data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch sentiment", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSentiment();
    }, []);

    const getColor = (value: number) => {
        if (value < 25) return "text-red-500";
        if (value < 45) return "text-orange-500";
        if (value < 55) return "text-yellow-500";
        if (value < 75) return "text-teal-500";
        return "text-green-500";
    };

    const getBgColor = (value: number) => {
        if (value < 25) return "bg-red-500/20 border-red-500/50";
        if (value < 45) return "bg-orange-500/20 border-orange-500/50";
        if (value < 55) return "bg-yellow-500/20 border-yellow-500/50";
        if (value < 75) return "bg-teal-500/20 border-teal-500/50";
        return "bg-green-500/20 border-green-500/50";
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-200">
                    <Gauge className="w-5 h-5" /> Market Sentiment
                </CardTitle>
                <CardDescription>Crypto Fear & Greed Index</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
                {loading ? (
                    <div className="animate-pulse h-16 w-16 rounded-full bg-zinc-800" />
                ) : data ? (
                    <div className="text-center space-y-2">
                        <div className={`text-5xl font-bold font-mono ${getColor(Number(data.value))}`}>
                            {data.value}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold border ${getBgColor(Number(data.value))} text-zinc-200`}>
                            {data.value_classification}
                        </div>
                    </div>
                ) : (
                    <div className="text-zinc-500">Unavailable</div>
                )}
            </CardContent>
        </Card>
    );
}
