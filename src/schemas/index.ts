import { SavingsSchema } from './savings';
import { StocksSchema } from './stocks';
import { ExpensesSchema } from './expenses';
import { FutureSchema } from './future';
import { SchemaModule } from '@/types/schema';

export const SCHEMA_REGISTRY: Record<string, SchemaModule> = {
    [SavingsSchema.id]: SavingsSchema,
    [StocksSchema.id]: StocksSchema,
    [ExpensesSchema.id]: ExpensesSchema,
    [FutureSchema.id]: FutureSchema,
};

export const ALL_SCHEMAS = Object.values(SCHEMA_REGISTRY);
