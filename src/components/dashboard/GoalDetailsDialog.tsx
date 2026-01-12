"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFinanceStore } from '@/store/financeStore';

interface GoalDetailsDialogProps {
    goalId: string | null;
    onClose: () => void;
    onUpdate: () => void;
}

export function GoalDetailsDialog({ goalId, onClose, onUpdate }: GoalDetailsDialogProps) {
    const { fetchStats } = useFinanceStore();
    const [goal, setGoal] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Action State
    const [action, setAction] = useState<'fund' | 'withdraw' | null>(null);
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (goalId) {
            setLoading(true);
            fetch(`/api/savings-goals/${goalId}`)
                .then(res => res.json())
                .then(data => setGoal(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setGoal(null);
        }
    }, [goalId]);

    const handleTransaction = async () => {
        if (!amount || !goalId) return;
        setIsSubmitting(true);

        const val = parseFloat(amount);
        const finalAmount = action === 'withdraw' ? -val : val;

        try {
            // We create a transaction allocated strictly to `savings` schema and this specific goal
            await fetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    amount: finalAmount, // Transaction amount tracks net flow
                    date: new Date(),
                    description: `${action === 'fund' ? 'Added to' : 'Withdrew from'} ${goal.name}`,
                    allocations: [
                        {
                            schemaId: 'savings',
                            amount: finalAmount,
                            savingsGoalId: goalId
                        }
                    ]
                })
            });

            await fetchStats();
            onUpdate();

            // Refresh local data
            const res = await fetch(`/api/savings-goals/${goalId}`);
            setGoal(await res.json());

            setAction(null);
            setAmount('');
        } catch (error) {
            console.error(error);
            alert('Transaction failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will delete the goal but KEEP the transaction history (unlinked).")) return;

        try {
            await fetch(`/api/savings-goals/${goalId}`, { method: 'DELETE' });
            onUpdate(); // Should trigger closing or refresh parent
            onClose();
        } catch (error) {
            console.error(error);
            alert('Delete failed');
        }
    };

    if (!goalId) return null;

    return (
        // Force mount/unmount when open changes if controlled from parent, 
        // but here we rely on 'goalId' being truthy.
        <Dialog open={!!goalId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                {goal ? goal.name : "Loading..."}
                            </DialogTitle>
                            {goal && (
                                <p className="text-zinc-500 text-sm mt-1">Target: ${goal.targetAmount.toLocaleString()}</p>
                            )}
                        </div>
                        {goal && (
                            <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleDelete}>
                                <Trash2 size={18} />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {loading || !goal ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <>
                        {/* Progress Detail */}
                        <div className="py-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-4xl font-mono font-bold text-white">
                                    ${(goal.currentAmount || 0).toLocaleString()}
                                </span>
                                <span className={cn(
                                    "text-sm font-medium px-2 py-1 rounded-full",
                                    goal.currentAmount >= goal.targetAmount ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-400"
                                )}>
                                    {Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(1)}% Funded
                                </span>
                            </div>
                            <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                                        backgroundColor: goal.color
                                    }}
                                />
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-12 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-green-900/30 hover:border-green-500 hover:text-green-400 transition-all",
                                    action === 'fund' && "border-green-500 bg-green-500/10 text-green-400"
                                )}
                                onClick={() => setAction(action === 'fund' ? null : 'fund')}
                            >
                                <ArrowUpRight className="mr-2" /> Add Funds
                            </Button>
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-12 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-red-900/30 hover:border-red-500 hover:text-red-400 transition-all",
                                    action === 'withdraw' && "border-red-500 bg-red-500/10 text-red-400"
                                )}
                                onClick={() => setAction(action === 'withdraw' ? null : 'withdraw')}
                            >
                                <ArrowDownLeft className="mr-2" /> Withdraw
                            </Button>
                        </div>

                        {/* Transaction Input Area */}
                        {action && (
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8 animate-in slide-in-from-top-2">
                                <label className="text-xs text-zinc-500 uppercase font-semibold mb-2 block">
                                    {action === 'fund' ? 'Amount to Save' : 'Amount to Withdraw'}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-zinc-950 border-zinc-700 text-lg font-mono"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <Button
                                        className={cn("min-w-[100px]", action === 'fund' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
                                        disabled={!amount || isSubmitting}
                                        onClick={handleTransaction}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* History */}
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">History</h3>
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                                {goal.allocations?.map((alloc: any) => (
                                    <div key={alloc.id} className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", alloc.amount > 0 ? "bg-green-500" : "bg-red-500")} />
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {alloc.transaction?.description || (alloc.amount > 0 ? 'Added Funds' : 'Withdrawal')}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {format(new Date(alloc.transaction?.date || alloc.createdAt || new Date()), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn("font-mono font-medium", alloc.amount > 0 ? "text-green-400" : "text-red-400")}>
                                            {alloc.amount > 0 ? '+' : ''}{alloc.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                {(!goal.allocations || goal.allocations.length === 0) && (
                                    <div className="text-center text-zinc-600 py-4 text-sm">No transactions yet</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
