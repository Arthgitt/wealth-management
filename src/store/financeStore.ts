import { create } from 'zustand';

interface SchemaAllocation {
    [schemaId: string]: number;
}

interface FinanceState {
    monthlyIncome: number; // Re-purposed as "Last Added Amount" or just UI state
    totalNetWorth: number;
    totalInvested: number;
    allocations: SchemaAllocation;
    selectedDate: Date | null;
    isLoading: boolean;

    fetchStats: (date?: Date) => Promise<void>;
    setSelectedDate: (date: Date | null) => void;
    // Temporary state for the "Add Money" flow
    setMonthlyIncome: (income: number) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    monthlyIncome: 0,
    totalNetWorth: 0,
    totalInvested: 0,
    allocations: {},
    selectedDate: null,
    isLoading: false,

    fetchStats: async (date) => {
        set({ isLoading: true });
        try {
            const query = date ? `?date=${date.toISOString().split('T')[0]}` : '';
            const res = await fetch(`/api/stats${query}`);
            const data = await res.json();
            console.log("FinanceStore Received:", data);
            set({
                totalNetWorth: data.totalNetWorth ?? 0,
                totalInvested: data.totalInvested ?? 0,
                allocations: data.allocations || {}
            });
        } catch (e) {
            console.error(e);
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedDate: (date) => {
        set({ selectedDate: date });
        get().fetchStats(date || undefined);
    },

    setMonthlyIncome: (income) => set({ monthlyIncome: income }),
}));
