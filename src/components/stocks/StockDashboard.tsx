"use client";

import { useEffect, useState } from 'react';
import { AssetList } from './AssetList';
import { TradeModal } from './TradeModal';

export function StockDashboard() {
    const [holdings, setHoldings] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalValue: 0, dayChange: 0, totalPL: 0 });
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchHoldings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stocks');
            const data = await res.json();
            setHoldings(data);

            // Calculate Summary
            let total = 0;
            let cost = 0;
            data.forEach((h: any) => {
                total += h.quantity * h.asset.currentPrice;
                cost += h.quantity * h.avgCost;
            });

            setSummary({
                totalValue: total,
                totalPL: total - cost,
                dayChange: 0 // We aren't tracking day change history yet, maybe add later
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshPrices = async () => {
        setIsLoading(true);
        await fetch('/api/stocks/refresh', { method: 'POST' });
        await fetchHoldings();
    };

    useEffect(() => {
        fetchHoldings();
    }, []);

    const openTrade = (ticker = '') => {
        setSelectedTicker(ticker);
        setIsTradeModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-md">
                    <div className="text-gray-400 mb-1">Portfolio Value</div>
                    <div className="text-3xl font-bold text-white">${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-md">
                    <div className="text-gray-400 mb-1">Total Return</div>
                    <div className={`text-3xl font-bold ${summary.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {summary.totalPL >= 0 ? '+' : ''}${summary.totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => openTrade()}
                        className="px-6 py-3 bg-white text-black font-bold rounded-full shadow-lg shadow-white/10 hover:scale-105 transition-transform"
                    >
                        + Keep Trading
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Holdings</h2>
                <button
                    onClick={handleRefreshPrices}
                    disabled={isLoading}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                    {isLoading ? 'Refreshing...' : '↻ Refresh Prices'}
                </button>
            </div>

            <AssetList holdings={holdings} onTrade={openTrade} />

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                prefilledTicker={selectedTicker}
                onSuccess={fetchHoldings}
            />
        </div>
    );
}
