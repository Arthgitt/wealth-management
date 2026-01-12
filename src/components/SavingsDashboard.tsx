"use client";
import React, { useEffect, useState } from 'react';
import { SavingsGoalCard } from './SavingsGoalCard';
import { GoalDetailsDialog } from './dashboard/GoalDetailsDialog';
import { Plus } from 'lucide-react';

interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | null;
    color: string;
}

export const SavingsDashboard = () => {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');

    const fetchGoals = async () => {
        try {
            const res = await fetch('/api/savings-goals');
            if (res.ok) {
                setGoals(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch goals", error);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/savings-goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    targetAmount: target,
                    deadline: deadline || null,
                    color: '#6366f1' // Default indigo for now, could add picker
                })
            });

            if (res.ok) {
                setIsCreating(false);
                setName('');
                setTarget('');
                setDeadline('');
                fetchGoals();
            } else {
                const err = await res.json();
                console.error("Server Error:", err);
                alert(`Failed to create goal: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Failed to create goal", error);
            alert("Failed to create goal. Check console for details.");
        }
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Savings Goals</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                    <Plus size={16} />
                    <span>New Goal</span>
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-white/60 mb-1">Goal Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-white/30"
                                placeholder="e.g. New Laptop"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/60 mb-1">Target Amount</label>
                            <input
                                type="number"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-white/30"
                                placeholder="1000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/60 mb-1">Deadline (Optional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-white/30"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-xs text-white/60 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm text-white font-medium transition-colors"
                        >
                            Create Goal
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                    <div key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                        <SavingsGoalCard {...goal} />
                    </div>
                ))}

                {goals.length === 0 && !isCreating && (
                    <div className="col-span-full py-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                        <p>No savings goals yet. Create one to get started!</p>
                    </div>
                )}
            </div>

            <GoalDetailsDialog
                goalId={selectedGoalId}
                onClose={() => setSelectedGoalId(null)}
                onUpdate={fetchGoals}
            />
        </div>
    );
};
