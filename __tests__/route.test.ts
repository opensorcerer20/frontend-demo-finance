import fs from 'fs';
import { NextRequest } from 'next/server';
import path from 'path';

import { GET } from '../src/app/api/route';

// Mock fs and path
jest.mock('fs');
jest.mock('path');

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    nextUrl: { searchParams: URLSearchParams };
    constructor(url: string) {
      this.nextUrl = { searchParams: new URL(url).searchParams };
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}));

const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
const mockPathJoin = path.join as jest.MockedFunction<typeof path.join>;

const mockTransactions = [
  { id: 't001', date: '2024-09-01', amount: 10, category: 'Food', merchant: 'Test' },
  { id: 't002', date: '2024-09-02', amount: 20, category: 'Transport', merchant: 'Test2' },
  { id: 't003', date: '2024-10-01', amount: 30, category: 'Food', merchant: 'Test3' },
];

beforeEach(() => {
  mockReadFileSync.mockReturnValue(JSON.stringify({ transactions: mockTransactions }));
  mockPathJoin.mockReturnValue('/mock/path/sample_transactions.json');
});

describe('GET /api', () => {
  it('should return recent transactions for getRecentTransactions with valid n', async () => {
    const request = new NextRequest('http://localhost/api?action=getRecentTransactions&n=2');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions[0].date.toISOString()).toBe('2024-10-01T00:00:00.000Z'); // sorted descending
  });

  it('should return 400 for getRecentTransactions with missing n', async () => {
    const request = new NextRequest('http://localhost/api?action=getRecentTransactions');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('missing n parameter');
  });

  it('should return 400 for invalid action', async () => {
    const request = new NextRequest('http://localhost/api?action=invalid');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe('Invalid parameters');
  });

  it('should return categories for aggregateByCategory', async () => {
    const request = new NextRequest('http://localhost/api?action=aggregateByCategory');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.categories).toBeDefined();
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.categories[0]).toHaveProperty('category');
    expect(data.categories[0]).toHaveProperty('total');
  });

  it('should return months for aggregateByMonth', async () => {
    const request = new NextRequest('http://localhost/api?action=aggregateByMonth');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.months).toBeDefined();
    expect(data.months.length).toBeGreaterThan(0);
    expect(data.months[0]).toHaveProperty('month');
    expect(data.months[0]).toHaveProperty('byCategory');
  });
});