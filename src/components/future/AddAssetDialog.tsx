"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddAssetDialog({ onAssetAdded }: { onAssetAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [type, setType] = useState("CRYPTO");
    const [ticker, setTicker] = useState("");
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");

    // Limit from Uninvested Cash
    const [maxVal, setMaxVal] = useState<number | null>(null);

    // Listen for custom event to open dialog with pre-filled amount (Total Cost)
    // Note: 'price' is Price Per Unit. We usually buy X amount of Stock.
    // However, if coming from "Invest Cache", we likely mean "I want to spend $X".
    // We can pre-fill a "Total Value" calculated field or just not pre-fill price per unit.
    // Let's assume the user has to calculate Quantity based on Price.
    // Or, we ideally should have a "Total Cost" field that auto-calcs quantity.
    // For now, let's just open the dialog.
    useEffect(() => {
        const handleOpen = (e: CustomEvent) => {
            setIsOpen(true);
            if (e.detail?.amount) {
                // If amount is passed, treat it as the "Available Budget"
                const limit = parseFloat(e.detail.amount.toString().replace(/,/g, ''));
                if (!isNaN(limit) && limit > 0) {
                    setMaxVal(limit);
                }
            }
        };
        window.addEventListener('open-add-asset-dialog' as any, handleOpen as any);
        return () => window.removeEventListener('open-add-asset-dialog' as any, handleOpen as any);
    }, []);

    // Calculate totals
    const qtyNum = parseFloat(quantity) || 0;
    const priceNum = parseFloat(price) || 0;
    const totalCost = qtyNum * priceNum;
    const isOverBudget = maxVal !== null && totalCost > maxVal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isOverBudget) {
            setError(`Insufficient funds. You have $${maxVal?.toLocaleString()} available.`);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch('/api/future', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker,
                    name: name || ticker,
                    type,
                    quantity: qtyNum,
                    price: priceNum
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add asset");
            }

            setIsOpen(false);
            onAssetAdded();
            // Reset form
            setTicker("");
            setName("");
            setPrice("");
            setQuantity("");
            setMaxVal(null); // Reset limit after success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) setMaxVal(null); }}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-none">
                    <Plus className="w-4 h-4 mr-1" /> Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Speculative Asset</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Budget Warning */}
                    {maxVal !== null && (
                        <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-md text-sm text-blue-200 flex justify-between items-center">
                            <span>Using Uninvested Cash:</span>
                            <span className="font-mono font-bold">${maxVal.toLocaleString()}</span>
                        </div>
                    )}

                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{error}</div>}

                    <div className="space-y-2">
                        <Label>Asset Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 focus:ring-purple-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                                <SelectItem value="CRYPTO">Crypto</SelectItem>
                                <SelectItem value="STARTUP">Startup / Angel</SelectItem>
                                <SelectItem value="COLLECTIBLE">Collectible</SelectItem>
                                <SelectItem value="STOCK">Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Identifier (Ticker)</Label>
                            <Input
                                placeholder={type === 'CRYPTO' ? "BTC" : "Airbnb"}
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name (Optional)</Label>
                            <Input
                                placeholder={type === 'CRYPTO' ? "Bitcoin" : "Series A"}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price per Unit ($)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 focus:ring-purple-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Total Cost</span>
                            <span className={cn("font-mono font-bold", isOverBudget ? "text-red-500" : "text-white")}>
                                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        {isOverBudget && (
                            <div className="text-xs text-red-400 text-right">
                                Exceeds available funds by ${(totalCost - (maxVal || 0)).toLocaleString()} <br />
                                Add more funds or reduce quantity.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading || isOverBudget}
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Portfolio"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Helper
import { cn } from "@/lib/utils";
