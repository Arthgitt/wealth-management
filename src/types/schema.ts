import React from 'react';

export interface SchemaData {
  id: string;
  name: string;
  allocationPercentage: number; // 0-100
  currentValue: number;
}

export interface SchemaContext {
  monthlyIncome: number;
  totalWealth: number;
}

export interface SchemaModule {
  id: string;
  name: string; // e.g., "Stocks"
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  // returns the calculated value based on logic (real-time or static)
  calculate: (allocatedAmount: number, context: SchemaContext) => Promise<number> | number; 
  Component: React.ComponentType<{ allocatedAmount: number }>; // The UI for this schema
}
