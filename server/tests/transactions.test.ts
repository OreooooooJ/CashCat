import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    account: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    $disconnect: vi.fn()
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  };
});

// Mock jsonwebtoken with proper default export
vi.mock('jsonwebtoken', async () => {
  return {
    default: {
      verify: vi.fn()
    },
    verify: vi.fn()
  }
});

describe('Transaction API Routes', () => {
  let prisma: any;
  const authToken = 'test-auth-token';
  
  const testUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Use string dates instead of Date objects to match the API response format
  const now = new Date();
  const nowISOString = now.toISOString();
  
  const testTransactions = [
    {
      id: 'trans1',
      amount: 100,
      type: 'income',
      category: 'Salary',
      description: 'Monthly salary',
      date: nowISOString,
      userId: 'user123',
      accountId: 'acc1',
      createdAt: nowISOString,
      updatedAt: nowISOString
    },
    {
      id: 'trans2',
      amount: -50,
      type: 'expense',
      category: 'Groceries',
      description: 'Weekly shopping',
      date: nowISOString,
      userId: 'user123',
      accountId: 'acc1',
      createdAt: nowISOString,
      updatedAt: nowISOString
    }
  ];
  
  beforeEach(() => {
    prisma = new PrismaClient();
    
    // Mock JWT verification to return the test user - important to use 'user123' here
    // which matches the user ID in our test transactions
    vi.mocked(jwt.verify).mockImplementation(() => ({ id: 'user123', email: 'test@example.com' }));
    
    // Reset mock implementations
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(testTransactions);
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(testTransactions[0]);
    vi.mocked(prisma.transaction.create).mockResolvedValue(testTransactions[0]);
    vi.mocked(prisma.transaction.delete).mockResolvedValue(testTransactions[0]);
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'acc1',
      name: 'Checking Account',
      type: 'checking',
      balance: 1000,
      userId: 'user123'
    });
    vi.mocked(prisma.account.update).mockResolvedValue({
      id: 'acc1',
      name: 'Checking Account',
      type: 'checking',
      balance: 1100, // Updated balance
      userId: 'user123'
    });
    
    // Mock findUnique to check for matching user ID
    vi.mocked(prisma.transaction.findUnique).mockImplementation(async (args) => {
      const id = args?.where?.id;
      if (id === 'trans1' || id === 'trans2') {
        return testTransactions.find(t => t.id === id);
      }
      return null;
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('GET /transactions', () => {
    it('should return all transactions for a user', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Only check specific properties and not the entire object
      expect(response.body).toHaveLength(testTransactions.length);
      expect(response.body[0].id).toBe(testTransactions[0].id);
      expect(response.body[0].amount).toBe(testTransactions[0].amount);
      expect(response.body[0].type).toBe(testTransactions[0].type);
      
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          userId: expect.any(String)
        })
      }));
    });
  });
  
  describe('GET /transactions/:id', () => {
    it('should return a specific transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/trans1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Only check specific properties and not the entire object
      expect(response.body.id).toBe(testTransactions[0].id);
      expect(response.body.amount).toBe(testTransactions[0].amount);
      expect(response.body.type).toBe(testTransactions[0].type);
      
      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'trans1'
        }
      });
    });
  });
  
  describe('POST /transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        amount: 100,
        type: 'income',
        category: 'Salary',
        description: 'Monthly salary',
        date: nowISOString,
        accountId: 'acc1'
      };
      
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTransaction);
      
      expect(response.status).toBe(201);
      
      // Only check specific properties and not the entire object
      expect(response.body.id).toBe(testTransactions[0].id);
      expect(response.body.amount).toBe(testTransactions[0].amount);
      expect(response.body.type).toBe(testTransactions[0].type);
      
      expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          amount: newTransaction.amount,
          type: newTransaction.type
        })
      }));
      
      // Verify account balance was updated
      expect(prisma.account.update).toHaveBeenCalled();
    });
  });
  
  describe('DELETE /transactions/:id', () => {
    it('should delete a transaction', async () => {
      const response = await request(app)
        .delete('/api/transactions/trans1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Only check specific properties and not the entire object
      expect(response.body.id).toBe(testTransactions[0].id);
      
      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: {
          id: 'trans1'
        }
      });
    });
  });
}); 