import fs from 'fs';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import path from 'path';
import { z } from 'zod';

import {
  Category,
  CategorySummary,
  MonthlySummary,
  Transaction,
} from '../../types';

export async function GET(request: NextRequest) {
  const ValidRequest = z.object({
    action: z.enum(['getRecentTransactions', 'aggregateByCategory', 'aggregateByMonth']),
    n: z.string().nullable().transform((val) => val ? parseInt(val, 10) : undefined).refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: "n must be a positive integer"
    })
  });

  const searchParams = request.nextUrl.searchParams;
  const params = {
    action: searchParams.get('action'),
    n: searchParams.get('n')
  };

  let action: string;
  let numTransactions: number | undefined;

  try {
    const validParams = ValidRequest.parse(params);
    action = validParams.action;
    numTransactions = validParams.n;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid parameters', errors: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Invalid parameters' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'data/sample_transactions.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);

  const transactions: Transaction[] = data.transactions.map((t: Transaction) => ({
    id: t.id,
    date: new Date(t.date),
    amount: t.amount,
    category: t.category as Category,
    merchant: t.merchant
  }));

  try {
    if (action === 'getRecentTransactions') {
      if (!numTransactions) {
        return NextResponse.json({ message: 'Bad Request: missing n parameter' }, { status: 400 });
      }

      const n = numTransactions;

      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      const recent = transactions.slice(0, n);

      return NextResponse.json({ transactions: recent });
    } else if (action === 'aggregateByCategory') {
      const categoryTotals = new Map<Category, { total: number, count: number }>();
      for (const t of transactions) {
        const cat = t.category;
        if (!categoryTotals.has(cat)) categoryTotals.set(cat, { total: 0, count: 0 });
        const data = categoryTotals.get(cat)!;
        data.total += t.amount;
        data.count += 1;
      }

      const grandTotal = Array.from(categoryTotals.values()).reduce((sum, d) => sum + d.total, 0);
      const summaries: CategorySummary[] = Array.from(categoryTotals.entries()).map(([category, data]) => ({
        category,
        total: data.total,
        transactionCount: data.count,
        percentage: Math.round(((data.total / grandTotal) * 100) * 100) / 100
      }));
      summaries.sort((a, b) => b.total - a.total);

      return NextResponse.json({ categories: summaries });
    } else if (action === 'aggregateByMonth') {
      const monthlyGroups = new Map<string, { transactions: Transaction[], label: string }>();
      for (const t of transactions) {
        const month = t.date.toISOString().slice(0, 7);
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyGroups.has(month)) monthlyGroups.set(month, { transactions: [], label });
        monthlyGroups.get(month)!.transactions.push(t);
      }

      const summaries: MonthlySummary[] = Array.from(monthlyGroups.entries()).map(([month, data]) => {
        const trans = data.transactions;
        const total = trans.reduce((sum, t) => sum + t.amount, 0);
        const transactionCount = trans.length;
        const categoryTotals = new Map<Category, { total: number, count: number }>();
        for (const t of trans) {
          const cat = t.category;
          if (!categoryTotals.has(cat)) categoryTotals.set(cat, { total: 0, count: 0 });
          const d = categoryTotals.get(cat)!;
          d.total += t.amount;
          d.count += 1;
        }
        const byCategory: CategorySummary[] = Array.from(categoryTotals.entries()).map(([category, d]) => ({
          category,
          total: d.total,
          transactionCount: d.count,
          percentage: Math.round((d.total / total) * 100 * 100) / 100
        }));
        byCategory.sort((a, b) => b.total - a.total);
        return {
          month,
          label: data.label,
          total,
          transactionCount,
          byCategory
        };
      });

      summaries.sort((a, b) => b.month.localeCompare(a.month));

      return NextResponse.json({ months: summaries });
    }
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
