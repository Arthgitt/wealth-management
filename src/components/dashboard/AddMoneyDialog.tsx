
import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/store/financeStore';
import { ALL_SCHEMAS } from '@/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AddMoneyDialog() {
    const { fetchStats } = useFinanceStore();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedSchemas, setSelectedSchemas] = useState<string[]>(ALL_SCHEMAS.map(s => s.id));
    const [allocations, setAllocations] = useState<Record<string, string>>({});

    // Savings Goals State
    const [goals, setGoals] = useState<any[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [goalAllocations, setGoalAllocations] = useState<Record<string, string>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            fetch('/api/savings-goals')
                .then(res => res.json())
                .then(data => setGoals(data))
                .catch(err => console.error(err));
        }
    }, [open]);

    const handleSchemaToggle = (id: string) => {
        setSelectedSchemas(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleGoalToggle = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const totalAllocated = Object.values(allocations).reduce((a, b) => a + parseFloat(b || '0'), 0) +
        Object.values(goalAllocations).reduce((a, b) => a + parseFloat(b || '0'), 0);

    const remaining = parseFloat(amount || '0') - totalAllocated;

    const handleSubmit = async () => {
        if (remaining !== 0) return; // Basic validation
        setIsSubmitting(true);
        try {
            await fetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    date,
                    allocations: [
                        ...Object.entries(allocations).map(([schemaId, amount]) => ({
                            schemaId,
                            amount
                        })),
                        ...Object.entries(goalAllocations).map(([goalId, amount]) => ({
                            schemaId: 'savings', // Always map goals to 'savings' schema
                            amount,
                            savingsGoalId: goalId
                        }))
                    ]
                })
            });
            await fetchStats(); // Refresh data

            // Check if future schema has allocation
            const futureAmount = parseFloat(allocations['future'] || '0');
            if (futureAmount > 0) {
                setStep(4);
                return;
            }

            setOpen(false);
            // Reset state
            setStep(1);
            setAmount('');
            setAllocations({});
            setGoalAllocations({});
            setSelectedGoals([]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Add Money
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-white bg-zinc-900 border-zinc-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-zinc-900 border-zinc-700 text-white",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        className="text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={() => setStep(2)}
                            disabled={!amount || parseFloat(amount) <= 0 || !date}
                        >
                            Next: Select Schemas
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <Label>Where should this money go?</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {ALL_SCHEMAS.map(schema => (
                                <div key={schema.id}
                                    className={cn(
                                        "flex items-center space-x-2 p-3 rounded-md border cursor-pointer transition-all",
                                        selectedSchemas.includes(schema.id)
                                            ? "bg-indigo-500/20 border-indigo-500"
                                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                    )}
                                    onClick={() => handleSchemaToggle(schema.id)}
                                >
                                    <Checkbox
                                        id={schema.id}
                                        checked={selectedSchemas.includes(schema.id)}
                                        className="border-white data-[state=checked]:bg-indigo-500"
                                    />
                                    <label htmlFor={schema.id} className="text-sm font-medium leading-none cursor-pointer text-white">
                                        {schema.name}
                                    </label>
                                </div>
                            ))}
                        </div>

                        {goals.length > 0 && (
                            <>
                                <Label className="block mt-6 mb-2">Specific Savings Goals (Optional)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {goals.map(goal => (
                                        <div key={goal.id}
                                            className={cn(
                                                "flex items-center space-x-2 p-3 rounded-md border cursor-pointer transition-all",
                                                selectedGoals.includes(goal.id)
                                                    ? "bg-emerald-500/20 border-emerald-500"
                                                    : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                            )}
                                            onClick={() => handleGoalToggle(goal.id)}
                                        >
                                            <Checkbox
                                                id={goal.id}
                                                checked={selectedGoals.includes(goal.id)}
                                                className="border-white data-[state=checked]:bg-emerald-500"
                                            />
                                            <label htmlFor={goal.id} className="text-sm font-medium leading-none cursor-pointer text-white">
                                                {goal.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => setStep(1)}
                            className="mr-2"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => setStep(3)}
                            disabled={selectedSchemas.length === 0}
                        >
                            Next: Allocate
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Total Amount:</span>
                            <span className="font-mono">${urlAmount(amount)}</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {selectedSchemas.map(id => {
                                const schema = ALL_SCHEMAS.find(s => s.id === id)!;
                                return (
                                    <div key={id} className="flex items-center gap-3">
                                        <Label className="w-32">{schema.name}</Label>
                                        <Input
                                            type="number"
                                            value={allocations[id] || ''}
                                            onChange={(e) => setAllocations(prev => ({ ...prev, [id]: e.target.value }))}
                                            className="bg-zinc-900 border-zinc-700 text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )
                            })}

                            {selectedGoals.length > 0 && (
                                <div className="pt-4 mt-4 border-t border-zinc-800">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Savings Goals</h4>
                                    {selectedGoals.map(id => {
                                        const goal = goals.find(g => g.id === id)!;
                                        return (
                                            <div key={id} className="flex items-center gap-3 mb-3">
                                                <Label className="w-32 truncate">{goal.name}</Label>
                                                <Input
                                                    type="number"
                                                    value={goalAllocations[id] || ''}
                                                    onChange={(e) => setGoalAllocations(prev => ({ ...prev, [id]: e.target.value }))}
                                                    className="bg-zinc-900 border-zinc-700 text-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-zinc-800 mt-2">
                            <span className="text-sm text-zinc-400">Remaining</span>
                            <span className={cn("font-mono font-bold", remaining === 0 ? "text-green-500" : "text-amber-500")}>
                                ${remaining.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-end gap-2 mt-2">
                            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={remaining !== 0 || isSubmitting}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transaction"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Investment Prompt (Optional) */}
                {step === 4 && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="mx-auto w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-white">Funds Added to Future!</h3>
                            <p className="text-sm text-zinc-400">
                                You allocated <span className="text-white font-mono">${parseFloat(allocations['future']).toLocaleString()}</span> to your speculative portfolio.
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                            Would you like to invest this cash into an asset (Crypto/Startup) right now?
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                    setOpen(false);
                                    // We need to trigger AddAssetDialog from here. 
                                    // Since it's clean architecture, we can dispatch a custom event or let the user navigate.
                                    // For now, let's just close and maybe navigate/notify.
                                    // Ideally, we'd open the dialog. Let's use window.location specific hash or event.
                                    window.dispatchEvent(new CustomEvent('open-add-asset-dialog', { detail: { amount: allocations['future'] } }));
                                }}
                            >
                                Yes, Invest Now
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    setOpen(false);
                                    setStep(1);
                                    setAmount('');
                                    setAllocations({});
                                    setGoalAllocations({});
                                    setSelectedGoals([]);
                                }}
                            >
                                No, Keep as Uninvested Cash
                            </Button>
                        </div>
                    </div>
                )
                }
            </DialogContent >
        </Dialog >
    );
}

function urlAmount(val: string) {
    return parseFloat(val || '0').toLocaleString('en-US', { minimumFractionDigits: 2 });
}
