import { SchemaModule } from '@/types/schema';
import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SavingsComponent = ({ allocatedAmount }: { allocatedAmount: number }) => {
    return (
        <Card className="h-full border-green-500/20 bg-green-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                    <PiggyBank className="w-5 h-5" /> Savings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold font-mono text-zinc-100">
                    ${allocatedAmount.toFixed(2)}
                </div>
                <p className="text-sm text-green-600/60 mt-2">
                    Safe & Secure liquid assets.
                </p>
            </CardContent>
        </Card>
    );
};

export const SavingsSchema: SchemaModule = {
    id: 'savings',
    name: 'Savings',
    description: 'Traditional bank savings and liquid assets',
    icon: PiggyBank,
    calculate: (amount) => amount, // Direct 1:1 for now
    Component: SavingsComponent,
};
