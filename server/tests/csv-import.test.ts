import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getSupportedFormats } from '../src/services/csvImportService';

// Hardcoded CSV data from amexMonthlyStatement.csv
const csvHeaders = ['Date', 'Description', 'Card Member', 'Account #', 'Amount', 'Category'];
const csvData = [
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
      create: vi.fn().mockResolvedValue({
        id: 'trans1',
        amount: 12.95,
        type: 'EXPENSE',
        category: 'Retail',
        description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
        date: new Date('2025-02-26'),
        userId: 'user123',
        accountId: 'acc123'
      })
    },
    $transaction: vi.fn((callbacks) => Promise.resolve(callbacks.map(() => ({
      id: 'trans1',
      amount: 12.95,
      type: 'EXPENSE',
      category: 'Retail',
      description: 'WALMART.COM W+ AMEX BENTONVILLE AR',
      date: new Date('2025-02-26'),
      userId: 'user123',
      accountId: 'acc123'
    }))))
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  };
});

// Mock fs with importOriginal helper
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createReadStream: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(csvHeaders);
          }
          if (event === 'data') {
            callback(csvData[0]);
          }
          if (event === 'end') {
            callback();
          }
          return { on: vi.fn() };
        }),
        once: vi.fn()
      })
    }),
    unlinkSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    writeFileSync: vi.fn()
  };
});

// Mock csv-parser
vi.mock('csv-parser', () => {
  const mockCsvParser = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    once: vi.fn().mockReturnThis()
  });
  return { default: mockCsvParser };
});

// Mock transaction processing service
vi.mock('../src/services/transactionProcessingService', () => ({
  processTransaction: vi.fn((transaction) => ({
    ...transaction,
    category: 'Retail'
  }))
}));

describe('CSV Import Service', () => {
  let prisma;
  let importCsvTransactions;
  let fs;
  
  beforeEach(async () => {
    // Import fs and the function after mocks are set up
    fs = await import('fs');
    const csvImportService = await import('../src/services/csvImportService');
    importCsvTransactions = csvImportService.importCsvTransactions;
    
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  it('should get supported formats', () => {
    const formats = getSupportedFormats();
    expect(formats).toContain('Amex');
    expect(formats).toContain('Chase');
    expect(formats).toContain('Bank of America');
  });
  
  it('should import transactions from CSV using Amex data', async () => {
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
    expect(result[0].accountId).toBe('acc123');
  });
  
  it('should detect format automatically if not specified', async () => {
    const result = await importCsvTransactions(
      'amexMonthlyStatement.csv',
      'user123',
      'acc123'
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(12.95);
    expect(result[0].type).toBe('EXPENSE');
  });
  
  it('should process multiple transactions from the CSV file', async () => {
    // Update the mock to process multiple rows
    vi.mocked(fs.createReadStream).mockReturnValueOnce({
      pipe: vi.fn().mockReturnValue({
        on: vi.fn((event, callback) => {
          if (event === 'headers') {
            callback(csvHeaders);
          }
          
          // Process first 5 rows of data
          if (event === 'data') {
            csvData.forEach(row => {
              callback(row);
            });
          }
          
          if (event === 'end') {
            callback();
          }
          return { on: vi.fn() };
        }),
        once: vi.fn()
      })
    });
    
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
    
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].description).toBe('WALMART.COM W+ AMEX BENTONVILLE AR');
    expect(result[1].description).toBe('AplPay HEYTEA-US- ALALLSTON MA');
    expect(result[2].description).toBe('OPENAI *CHATGPT SUBSSAN FRANCISCO CA');
  });
}); 