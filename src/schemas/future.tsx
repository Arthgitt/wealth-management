import { SchemaModule } from '@/types/schema';
import { Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FutureComponent = ({ allocatedAmount }: { allocatedAmount: number }) => {
    return (
        <Card className="h-full border-purple-500/20 bg-purple-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-500">
                    <Rocket className="w-5 h-5" /> Future
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold font-mono text-zinc-100">
                    ${allocatedAmount.toFixed(2)}
                </div>
                <p className="text-sm text-purple-600/60 mt-2">
                    Long-term goals and speculative assets.
                </p>
            </CardContent>
        </Card>
    );
};

export const FutureSchema: SchemaModule = {
    id: 'future',
    name: 'Future Investment',
    description: 'High risk / High reward',
    icon: Rocket,
    calculate: (amount) => amount,
    Component: FutureComponent,
};
