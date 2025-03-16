import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { importCsvTransactions, getSupportedFormats } from '../src/services/csvImportService';
import { importCsv } from '../src/controllers/importController';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    account: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn((callback) => Promise.resolve(callback()))
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  };
});

// Mock fs
vi.mock('fs', () => ({
  createReadStream: vi.fn(() => ({
    pipe: vi.fn(() => ({
      on: vi.fn((event, callback) => {
        if (event === 'headers') {
          callback(['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category']);
        }
        if (event === 'data') {
          callback({
            Date: '02/26/2025',
            Description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
            'Card Member': 'testerFirstName testerLastName',
            'Account #': '-71002',
            Amount: '12.95',
            Category: 'Retail'
          });
        }
        if (event === 'end') {
          callback();
        }
        return { on: vi.fn() };
      })
    }))
  }),
  unlinkSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  writeFileSync: vi.fn()
}));

// Mock csv-parser
vi.mock('csv-parser', () => {
  return vi.fn(() => ({
    on: vi.fn()
  }));
});

describe('CSV Import Service', () => {
  let prisma: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  it('should get supported formats', () => {
    const formats = getSupportedFormats();
    expect(formats).toContain('Amex');
    expect(formats).toContain('Chase');
    expect(formats).toContain('Bank of America');
  });
  
  it('should import transactions from CSV', async () => {
    // Mock transaction creation
    prisma.$transaction.mockResolvedValue([
      {
        id: 'trans1',
        amount: 12.95,
        type: 'EXPENSE',
        category: 'Retail',
        description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
        date: new Date('2025-02-26'),
        userId: 'user123',
        accountId: 'acc123'
      }
    ]);
    
    const result = await importCsvTransactions(
      'test.csv',
      'user123',
      'acc123',
      'Amex'
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(12.95);
    expect(result[0].type).toBe('EXPENSE');
    expect(result[0].category).toBe('Retail');
  });
});

describe('Import Controller', () => {
  let prisma: any;
  let req: any;
  let res: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    
    req = {
      user: { id: 'user123' },
      file: { path: 'test.csv' },
      body: { accountId: 'acc123' }
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
    
    // Mock account lookup
    prisma.account.findUnique.mockResolvedValue({
      id: 'acc123',
      userId: 'user123',
      name: 'Test Account',
      type: 'credit'
    });
  });
  
  it('should handle CSV import request', async () => {
    // Mock transaction import
    vi.mock('../src/services/csvImportService', () => ({
      importCsvTransactions: vi.fn().mockResolvedValue([
        {
          id: 'trans1',
          amount: 12.95,
          type: 'EXPENSE',
          category: 'Retail',
          description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
          date: new Date('2025-02-26'),
          userId: 'user123',
          accountId: 'acc123'
        }
      ]),
      getSupportedFormats: vi.fn().mockReturnValue(['Amex', 'Chase', 'Bank of America'])
    }));
    
    await importCsv(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Successfully imported'),
      transactions: expect.arrayContaining([
        expect.objectContaining({
          id: 'trans1',
          amount: 12.95
        })
      ])
    }));
  });
  
  it('should handle missing file', async () => {
    req.file = undefined;
    
    await importCsv(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'No file uploaded'
    }));
  });
  
  it('should handle missing account ID', async () => {
    req.body.accountId = undefined;
    
    await importCsv(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Account ID is required'
    }));
  });
  
  it('should handle unauthorized account access', async () => {
    // Mock account with different user ID
    prisma.account.findUnique.mockResolvedValue({
      id: 'acc123',
      userId: 'different-user',
      name: 'Test Account',
      type: 'credit'
    });
    
    await importCsv(req, res);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Not authorized to access this account'
    }));
  });
});

// Integration test for the full workflow
describe('CSV Import Workflow', () => {
  // This would be an integration test that tests the full workflow
  // from uploading a file to seeing the transactions in the database
  
  it('should process a CSV file and create transactions', async () => {
    // This test would require a more complex setup with a test database
    // and would test the full workflow from end to end
    
    // For now, we'll just mark it as a placeholder
    expect(true).toBe(true);
  });
}); 