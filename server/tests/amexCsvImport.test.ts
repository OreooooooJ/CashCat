import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { importCsvTransactions, getSupportedFormats } from '../src/services/csvImportService';

// Sample data from amexMonthlyStatement.csv
const amexCsvData = [
  {
    Date: '02/26/2025',
    Description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
    'Card Member': 'testerFirstName testerLastName',
    'Account #': '-71002',
    Amount: '12.95',
    Category: 'Retail'
  },
  {
    Date: '02/24/2025',
    Description: 'AplPay HEYTEA-US- ALALLSTON MA',
    'Card Member': 'testerFirstName testerLastName',
    'Account #': '-71002',
    Amount: '14.08',
    Category: 'Dining'
  },
  {
    Date: '02/24/2025',
    Description: 'OPENAI *CHATGPT SUBSSAN FRANCISCO CA',
    'Card Member': 'testerFirstName testerLastName',
    'Account #': '-71002',
    Amount: '20.00',
    Category: 'Subscription'
  },
  {
    Date: '02/24/2025',
    Description: 'XIN MULAN LLC 00-080WALTHAM MA',
    'Card Member': 'testerFirstName testerLastName',
    'Account #': '-71002',
    Amount: '82.12',
    Category: 'Dining'
  },
  {
    Date: '02/23/2025',
    Description: 'AMAZON MARKEPLACE NA PA',
    'Card Member': 'testerFirstName testerLastName',
    'Account #': '-71002',
    Amount: '84.99',
    Category: 'Online Shopping'
  }
];

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
vi.mock('fs', () => {
  return {
    createReadStream: vi.fn(() => ({
      pipe: vi.fn(() => ({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category']);
          }
          if (event === 'data') {
            callback(amexCsvData[0]);
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
  };
});

// Mock csv-parser
vi.mock('csv-parser', () => {
  return vi.fn(() => ({
    on: vi.fn()
  }));
});

describe('Amex CSV Import', () => {
  let prisma: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  it('should import a single transaction from Amex CSV', async () => {
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
      'amexMonthlyStatement.csv',
      'user123',
      'acc123',
      'Amex'
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(12.95);
    expect(result[0].type).toBe('EXPENSE');
    expect(result[0].category).toBe('Retail');
    expect(result[0].description).toBe('WALMART.COM W+ AMEX BENTONVILLE AR');
  });
  
  it('should import multiple transactions from Amex CSV', async () => {
    // Update the mock to process multiple rows
    const mockCreateReadStream = vi.fn(() => ({
      pipe: vi.fn(() => ({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category']);
          }
          
          // Process multiple rows of data
          if (event === 'data') {
            amexCsvData.forEach(row => {
              callback(row);
            });
          }
          
          if (event === 'end') {
            callback();
          }
          return { on: vi.fn() };
        })
      }))
    }));
    
    vi.spyOn(fs, 'createReadStream').mockImplementationOnce(mockCreateReadStream);
    
    // Mock transaction creation for multiple transactions
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
      },
      {
        id: 'trans2',
        amount: 14.08,
        type: 'EXPENSE',
        category: 'Dining',
        description: 'AplPay HEYTEA-US- ALALLSTON MA',
        date: new Date('2025-02-24'),
        userId: 'user123',
        accountId: 'acc123'
      },
      {
        id: 'trans3',
        amount: 20.00,
        type: 'EXPENSE',
        category: 'Subscription',
        description: 'OPENAI *CHATGPT SUBSSAN FRANCISCO CA',
        date: new Date('2025-02-24'),
        userId: 'user123',
        accountId: 'acc123'
      },
      {
        id: 'trans4',
        amount: 82.12,
        type: 'EXPENSE',
        category: 'Dining',
        description: 'XIN MULAN LLC 00-080WALTHAM MA',
        date: new Date('2025-02-24'),
        userId: 'user123',
        accountId: 'acc123'
      },
      {
        id: 'trans5',
        amount: 84.99,
        type: 'EXPENSE',
        category: 'Online Shopping',
        description: 'AMAZON MARKEPLACE NA PA',
        date: new Date('2025-02-23'),
        userId: 'user123',
        accountId: 'acc123'
      }
    ]);
    
    const result = await importCsvTransactions(
      'amexMonthlyStatement.csv',
      'user123',
      'acc123',
      'Amex'
    );
    
    expect(result.length).toBe(5);
    expect(result[0].description).toBe('WALMART.COM W+ AMEX BENTONVILLE AR');
    expect(result[1].description).toBe('AplPay HEYTEA-US- ALALLSTON MA');
    expect(result[2].description).toBe('OPENAI *CHATGPT SUBSSAN FRANCISCO CA');
    expect(result[3].description).toBe('XIN MULAN LLC 00-080WALTHAM MA');
    expect(result[4].description).toBe('AMAZON MARKEPLACE NA PA');
  });
  
  it('should handle negative amounts as expenses', async () => {
    // Update the mock to use a negative amount
    const mockCreateReadStream = vi.fn(() => ({
      pipe: vi.fn(() => ({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category']);
          }
          if (event === 'data') {
            callback({
              ...amexCsvData[0],
              Amount: '-12.95' // Negative amount
            });
          }
          if (event === 'end') {
            callback();
          }
          return { on: vi.fn() };
        })
      }))
    }));
    
    vi.spyOn(fs, 'createReadStream').mockImplementationOnce(mockCreateReadStream);
    
    // Mock transaction creation
    prisma.$transaction.mockResolvedValue([
      {
        id: 'trans1',
        amount: 12.95, // Should be stored as absolute value
        type: 'EXPENSE',
        category: 'Retail',
        description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
        date: new Date('2025-02-26'),
        userId: 'user123',
        accountId: 'acc123'
      }
    ]);
    
    const result = await importCsvTransactions(
      'amexMonthlyStatement.csv',
      'user123',
      'acc123',
      'Amex'
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(12.95); // Should be absolute value
    expect(result[0].type).toBe('EXPENSE');
  });
  
  it('should handle positive amounts as income', async () => {
    // Update the mock to use a positive amount for a refund
    const mockCreateReadStream = vi.fn(() => ({
      pipe: vi.fn(() => ({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category']);
          }
          if (event === 'data') {
            callback({
              Date: '02/10/2025',
              Description: 'Platinum Digital Entertainment Credit',
              'Card Member': 'testerFirstName testerLastName',
              'Account #': '-71002',
              Amount: '16.99', // Positive amount (refund)
              Category: 'Refund/Adjustment'
            });
          }
          if (event === 'end') {
            callback();
          }
          return { on: vi.fn() };
        })
      }))
    }));
    
    vi.spyOn(fs, 'createReadStream').mockImplementationOnce(mockCreateReadStream);
    
    // Mock transaction creation
    prisma.$transaction.mockResolvedValue([
      {
        id: 'trans1',
        amount: 16.99,
        type: 'INCOME',
        category: 'Refund/Adjustment',
        description: 'Platinum Digital Entertainment Credit',
        date: new Date('2025-02-10'),
        userId: 'user123',
        accountId: 'acc123'
      }
    ]);
    
    const result = await importCsvTransactions(
      'amexMonthlyStatement.csv',
      'user123',
      'acc123',
      'Amex'
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(16.99);
    expect(result[0].type).toBe('INCOME');
    expect(result[0].category).toBe('Refund/Adjustment');
  });
}); 