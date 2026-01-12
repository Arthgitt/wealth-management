"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";

interface EditAssetDialogProps {
    holding: any;
    onUpdate: () => void;
}

export function EditAssetDialog({ holding, onUpdate }: EditAssetDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState(holding.asset.name);
    const [quantity, setQuantity] = useState(holding.quantity);
    const [avgCost, setAvgCost] = useState(holding.avgCost);
    const [currentPrice, setCurrentPrice] = useState(holding.asset.currentPrice);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/future', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: holding.id,
                    name,
                    quantity,
                    avgCost,
                    currentPrice
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            setIsOpen(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200">
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} className="bg-zinc-900 border-zinc-700" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="bg-zinc-900 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Avg Cost ($)</Label>
                            <Input
                                type="number"
                                value={avgCost}
                                onChange={e => setAvgCost(e.target.value)}
                                className="bg-zinc-900 border-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Current Market Price ($)</Label>
                        <Input
                            type="number"
                            value={currentPrice}
                            onChange={e => setCurrentPrice(e.target.value)}
                            className="bg-zinc-900 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500">Override the automated price.</p>
                    </div>

                    <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
