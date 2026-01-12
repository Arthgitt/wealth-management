import { SchemaModule } from '@/types/schema';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StocksComponent = ({ allocatedAmount }: { allocatedAmount: number }) => {
    return (
        <Card className="h-full border-blue-500/20 bg-blue-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-500">
                    <TrendingUp className="w-5 h-5" /> Stocks
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold font-mono text-zinc-100">
                    ${allocatedAmount.toFixed(2)}
                </div>
                <p className="text-sm text-blue-600/60 mt-2">
                    Market investments (Real-time tracking enabled).
                </p>
            </CardContent>
        </Card>
    );
};

export const StocksSchema: SchemaModule = {
    id: 'stocks',
    name: 'Stocks',
    description: 'Stock market investments',
    icon: TrendingUp,
    calculate: (amount) => amount,
    Component: StocksComponent,
};
