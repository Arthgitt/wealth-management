import { SchemaModule } from '@/types/schema';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ExpensesComponent = ({ allocatedAmount }: { allocatedAmount: number }) => {
    return (
        <Card className="h-full border-red-500/20 bg-red-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                    <CreditCard className="w-5 h-5" /> Expenses
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold font-mono text-zinc-100">
                    ${allocatedAmount.toFixed(2)}
                </div>
                <p className="text-sm text-red-600/60 mt-2">
                    Monthly recurring expenses and bills.
                </p>
            </CardContent>
        </Card>
    );
};

export const ExpensesSchema: SchemaModule = {
    id: 'expenses',
    name: 'Expenses',
    description: 'Monthly expenses',
    icon: CreditCard,
    calculate: (amount) => amount,
    Component: ExpensesComponent,
};
