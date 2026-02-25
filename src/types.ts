import { z } from 'zod';

/* START EXAMPLE CODE */

// Define a schema for a user
const UserSchema = z.object({
  username: z.string(),
  xp: z.number(),
});

// Untrusted data
const input = { username: "billie", xp: 100 };

// Parse and validate the data
try {
  const data = UserSchema.parse(input);
  console.log(data.username); // "billie"
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.issues);
  }
}

// Extract the TypeScript type from the schema
export type User = z.infer<typeof UserSchema>;

/* END EXAMPLE CODE */

/*

MonthlySummary

CategorySummary
*/

export enum Category {
  Food = "Food",
  Transport = "Transport",
  Housing = "Housing",
  Entertainment = "Entertainment",
  Subscriptions = "Subscriptions",
  Health = "Health"
}

const TransactionSchema = z.object({
  id: z.string(),
  date: z.date(),
  amount: z.number(),
  category: z.enum(Category),
  merchant: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

const CategorySummarySchema = z.object({
  category: z.enum(Category),
  total: z.number(),
  transactionCount: z.number(),
  percentage: z.number(),
})

export type CategorySummary = z.infer<typeof CategorySummarySchema>;

const MonthlySummarySchema = z.object({
  month: z.string(), // e.g. "2024-09" — sortable and usable as a chart label
  label: z.string(), // e.g. "Sep 2024" — human readable version for display
  total: z.number(),
  transactionCount: z.number(),
  byCategory: z.array(CategorySummarySchema)
});

export type MonthlySummary = z.infer<typeof MonthlySummarySchema>;
