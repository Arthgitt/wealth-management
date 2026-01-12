"use client";

import { useState } from 'react';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefilledTicker?: string;
    onSuccess: () => void;
}

export function TradeModal({ isOpen, onClose, prefilledTicker = '', onSuccess }: TradeModalProps) {
    const [ticker, setTicker] = useState(prefilledTicker);
    const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!ticker || !quantity || !price) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker,
                    type,
                    quantity: Number(quantity),
                    price: Number(price)
                }),
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
                onClose();
                // Reset form
                setQuantity('');
                setPrice('');
                setTicker('');
            } else {
                setError(data.error || "Transaction failed");
            }
        } catch (err) {
            console.error(err);
            setError("Network error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Trade Asset</h2>
                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{error}</div>}

                <div className="flex bg-white/5 rounded-lg p-1 mb-6">
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'BUY' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setType('BUY')}
                    >
                        Buy
                    </button>
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'SELL' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setType('SELL')}
                    >
                        Sell
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Ticker Symbol</label>
                        <input
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            placeholder="AAPL"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                            <input
                                type="number"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Price per Share</label>
                            <input
                                type="number"
                                step="any"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="$0.00"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition-all shadow-lg shadow-emerald-500/20
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90'}
                `}
                        >
                            {isLoading ? 'Processing...' : `Confirm ${type === 'BUY' ? 'Purchase' : 'Sale'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
