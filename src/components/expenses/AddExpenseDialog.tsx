"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
}

export function AddExpenseDialog({ onExpenseAdded }: { onExpenseAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [categoryId, setCategoryId] = useState<string>('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        if (res.ok) {
            setCategories(await res.json());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    description,
                    date: date?.toISOString(),
                    categoryId: isCreatingCategory ? undefined : categoryId,
                    newCategoryName: isCreatingCategory ? newCategoryName : undefined
                })
            });
            onExpenseAdded();
            setOpen(false);
            setAmount('');
            setDescription('');
            setCategoryId('');
            setNewCategoryName('');
            setIsCreatingCategory(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Add Expense
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 text-white"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 text-white"
                            placeholder="e.g. Grocery"
                            required
                        />
                        <p className="text-xs text-zinc-500">
                            Items in quotes "" will be preserved exactly. Others will be title-cased.
                        </p>
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

                    <div className="space-y-2">
                        <Label>Category</Label>
                        {!isCreatingCategory ? (
                            <div className="flex gap-2">
                                <div className="relative w-full">
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(true)} className="border-zinc-700 text-zinc-300">
                                    New
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="bg-zinc-900 border-zinc-700 text-white"
                                    placeholder="New Category Name"
                                    required
                                />
                                <Button type="button" variant="ghost" onClick={() => setIsCreatingCategory(false)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
