import React from 'react';

interface SavingsGoalProps {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string | null;
    color: string;
}

export const SavingsGoalCard: React.FC<SavingsGoalProps> = ({
    name,
    targetAmount,
    currentAmount,
    deadline,
    color
}) => {
    const progress = Math.min((currentAmount / targetAmount) * 100, 100);
    const remaining = targetAmount - currentAmount;

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white/90">{name}</h3>
                    {deadline && (
                        <p className="text-xs text-white/50 mt-1">
                            Target: {new Date(deadline).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                >
                    {Math.round(progress)}%
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-white/70">${currentAmount.toLocaleString()}</span>
                    <span className="text-white/50">of ${targetAmount.toLocaleString()}</span>
                </div>

                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: color }}
                    />
                </div>

                <div className="text-xs text-white/40 text-right">
                    ${Math.max(0, remaining).toLocaleString()} to go
                </div>
            </div>
        </div>
    );
};
