"use client";

import { useEffect } from "react";
import { SchemaGrid } from "@/components/dashboard/SchemaGrid";
import { useFinanceStore } from "@/store/financeStore";
import { AddMoneyDialog } from "@/components/dashboard/AddMoneyDialog";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Home() {
  const { totalNetWorth, totalInvested, fetchStats, selectedDate, setSelectedDate } = useFinanceStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-12 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-10">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Wealth<span className="text-indigo-500">OS</span>
            </h1>
            <p className="text-zinc-500 mt-2">Personal Expense & Investment Tracker</p>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <div className="flex items-center gap-2 justify-end">

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedDate ? `View as of: ${format(selectedDate, "PPP")}` : "Filter by Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date) => setSelectedDate(date || null)}
                    initialFocus
                    className="text-white"
                  />
                  {selectedDate && (
                    <div className="p-2 border-t border-zinc-800">
                      <Button variant="ghost" className="w-full text-xs" onClick={() => setSelectedDate(null)}>
                        Clear Filter (Show All)
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-8">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">Total Invested</div>
                <div className="text-3xl font-mono font-bold tracking-tight text-white/60">
                  ${(totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">Total Net Worth</div>
                <div className="text-3xl font-mono font-bold tracking-tight text-white">
                  ${(totalNetWorth || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Portfolio Breakdown</h2>
          <AddMoneyDialog />
        </section>

        <section>
          <SchemaGrid />
        </section>

        <section className="pt-8 border-t border-zinc-900">
          <TransactionHistory />
        </section>

      </div>
    </main>
  );
}
