"use client";

import { useFinanceStore } from '@/store/financeStore';
import { ALL_SCHEMAS } from '@/schemas';
import Link from 'next/link';

export function SchemaGrid() {
    const { allocations } = useFinanceStore();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_SCHEMAS.map((schema) => {
                const allocatedAmount = allocations[schema.id] || 0;

                const content = (
                    <div className="h-64 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
                        <schema.Component allocatedAmount={allocatedAmount} />
                    </div>
                );

                if (schema.id === 'expenses') {
                    return (
                        <Link href="/expenses" key={schema.id} className="block transition-transform hover:scale-[1.02]">
                            {content}
                        </Link>
                    );
                }

                if (schema.id === 'savings') {
                    return (
                        <Link href="/savings" key={schema.id} className="block transition-transform hover:scale-[1.02]">
                            {content}
                        </Link>
                    );
                }

                if (schema.id === 'stocks') {
                    return (
                        <Link href="/stocks" key={schema.id} className="block transition-transform hover:scale-[1.02]">
                            {content}
                        </Link>
                    );
                }



                if (schema.id === 'future') {
                    return (
                        <Link href="/future" key={schema.id} className="block transition-transform hover:scale-[1.02]">
                            {content}
                        </Link>
                    );
                }

                return (
                    <div key={schema.id}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}
