"use client";
import React from 'react';

// Define types locally or in a shared types file. For speed, local here.
interface Asset {
    id: string;
    ticker: string;
    name: string;
    currentPrice: number;
}

interface Holding {
    id: string;
    asset: Asset;
    quantity: number;
    avgCost: number;
}

interface AssetListProps {
    holdings: Holding[];
    onTrade: (ticker: string) => void;
}

export function AssetList({ holdings, onTrade }: AssetListProps) {
    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Your Assets</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                            <th className="pb-3 pl-2">Asset</th>
                            <th className="pb-3">Price</th>
                            <th className="pb-3">Balance</th>
                            <th className="pb-3 text-right pr-2" title="(Current Value - Cost Basis)">Return ⓘ</th>
                            <th className="pb-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((h) => {
                            const currentValue = h.quantity * h.asset.currentPrice;
                            const costBasis = h.quantity * h.avgCost;
                            const pl = currentValue - costBasis;
                            const plPercent = (pl / costBasis) * 100;
                            const isProfit = pl >= 0;

                            return (
                                <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 pl-2">
                                        <div className="font-bold text-white">{h.asset.ticker}</div>
                                        <div className="text-xs text-gray-400">{h.asset.name}</div>
                                    </td>
                                    <td className="py-4 text-white">
                                        ${h.asset.currentPrice.toFixed(2)}
                                    </td>
                                    <td className="py-4">
                                        <div className="text-white">${currentValue.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">{h.quantity.toFixed(4)} shares</div>
                                    </td>
                                    <td className={`py-4 text-right pr-2 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <div>{isProfit ? '+' : ''}${pl.toFixed(2)}</div>
                                        <div className="text-xs">{isProfit ? '+' : ''}{plPercent.toFixed(2)}%</div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button
                                            onClick={() => onTrade(h.asset.ticker)}
                                            className="p-2 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
                                        >
                                            ⇄
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {holdings.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    No assets found. Start investing!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
