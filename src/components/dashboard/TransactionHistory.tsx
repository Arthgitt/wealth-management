"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Transaction {
    id: string;
    amount: number;
    date: string;
    description?: string;
    allocations: {
        schemaId: string;
        amount: number;
    }[];
}

export function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showDetails, setShowDetails] = useState(true);
    // Sort logic removed in favor of date filtering as per request, 
    // or we can keep it but default to newest first (desc) which is standard.
    // The request implies "sort date feature as user select date and then it filters",
    // which sounds more like filtering than sorting. I'll stick to 'desc' sort by default
    // and filter by the selected date.

    const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const filteredTransactions = transactions
        .filter(tx => {
            if (!filterDate) return true;
            return isSameDay(new Date(tx.date), filterDate);
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Always desc for now

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate]);

    // Simple polling/refresh mechanism could be added here or triggered via store
    const fetchHistory = async () => {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        setTransactions(data);
    };

    useEffect(() => {
        fetchHistory();
        // Listen to custom event for refresh if we wanted to be fancy, 
        // but for now we'll just load on mount. 
        // Ideally the store should hold this or trigger a re-fetch.
    }, []);

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-zinc-100">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="show-details"
                                checked={showDetails}
                                onCheckedChange={setShowDetails}
                            />
                            <label htmlFor="show-details" className="text-sm font-medium leading-none text-zinc-400 cursor-pointer">
                                Show Details
                            </label>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "justify-start text-left font-normal text-zinc-400 hover:text-white",
                                        !filterDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filterDate ? format(filterDate, "PPP") : <span>Filter Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800" align="end">
                                <Calendar
                                    mode="single"
                                    selected={filterDate}
                                    onSelect={setFilterDate}
                                    initialFocus
                                    className="text-white"
                                />
                                {filterDate && (
                                    <div className="p-2 border-t border-zinc-800">
                                        <Button variant="ghost" className="w-full text-xs" onClick={() => setFilterDate(undefined)}>
                                            Clear Filter
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    {paginatedTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0 animation-fade-in">
                            <div>
                                <div className="text-sm text-zinc-400">{format(new Date(tx.date), "PPP")}</div>
                                {showDetails && (
                                    <div className="text-xs text-zinc-500 mt-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                        {tx.allocations.map(a => `${a.schemaId}: $${a.amount}`).join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className={cn("font-mono font-bold", tx.amount >= 0 ? "text-green-500" : "text-red-500")}>
                                {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                            </div>
                        </div>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <div className="text-zinc-500 text-sm italic">No history found.</div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs text-zinc-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card >
    );
}
