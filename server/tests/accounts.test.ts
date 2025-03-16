import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import accountRoutes from '../src/routes/accounts';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    account: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    transaction: {
      findMany: vi.fn()
    },
    $disconnect: vi.fn()
  };
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  };
});

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(),
  sign: vi.fn()
}));

describe('Account API Routes', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let prisma: any;
  
  const testUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const testAccounts = [
    {
      id: 'acc1',
      name: 'Checking Account',
      type: 'debit',
      balance: 1000,
      institution: 'Bank of America',
      lastFour: '1234',
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'acc2',
      name: 'Credit Card',
      type: 'credit',
      balance: -500,
      institution: 'Chase',
      lastFour: '5678',
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const testTransactions = [
    {
      id: 'trans1',
      amount: 100,
      type: 'income',
      category: 'Salary',
      description: 'Monthly salary',
      date: new Date(),
      userId: 'user123',
      accountId: 'acc1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock JWT verification
    vi.mocked(jwt.verify).mockImplementation(() => ({ id: 'user123', email: 'test@example.com' }));
    
    // Setup request and response objects
    req = {
      user: { id: 'user123', email: 'test@example.com' },
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
    
    // Reset mock implementations
    vi.mocked(prisma.account.findMany).mockResolvedValue(testAccounts);
    vi.mocked(prisma.account.findUnique).mockResolvedValue(testAccounts[0]);
    vi.mocked(prisma.account.create).mockResolvedValue(testAccounts[0]);
    vi.mocked(prisma.account.update).mockResolvedValue(testAccounts[0]);
    vi.mocked(prisma.account.delete).mockResolvedValue(testAccounts[0]);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(testTransactions);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(testUser);
  });
  
  describe('GET /accounts', () => {
    it('should return all accounts for a user', async () => {
      // TODO: Implement test
    });
  });
  
  describe('GET /accounts/:id', () => {
    it('should return a specific account', async () => {
      // TODO: Implement test
    });
  });
  
  describe('GET /accounts/:id/transactions', () => {
    it('should return transactions for a specific account', async () => {
      // TODO: Implement test
    });
  });
  
  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      // TODO: Implement test
    });
  });
  
  describe('PUT /accounts/:id', () => {
    it('should update an account', async () => {
      // TODO: Implement test
    });
  });
  
  describe('DELETE /accounts/:id', () => {
    it('should delete an account', async () => {
      // TODO: Implement test
    });
  });
});

describe('Account API Endpoints', () => {
  const prisma = new PrismaClient();
  
  const testUser = {
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const testAccounts = [
    {
      id: 'account-id-1',
      name: 'Checking Account',
      type: 'debit',
      balance: 1000,
      institution: 'Test Bank',
      lastFour: '1234',
      color: '#3B82F6',
      userId: testUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'account-id-2',
      name: 'Credit Card',
      type: 'credit',
      balance: -500,
      institution: 'Test Credit',
      lastFour: '5678',
      color: '#EF4444',
      userId: testUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const testTransactions = [
    {
      id: 'trans-id-1',
      amount: 100,
      type: 'INCOME',
      category: 'Income',
      description: 'Test Income',
      date: new Date(),
      userId: testUser.id,
      accountId: 'account-id-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const validToken = 'valid.jwt.token';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock JWT verify to return a valid user ID
    vi.mocked(jwt.verify).mockReturnValue({ userId: testUser.id } as any);
    
    // Mock Prisma findUnique to return the test user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(testUser as any);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/accounts', () => {
    it('should return all accounts for a user', async () => {
      // Mock Prisma findMany to return test accounts
      vi.mocked(prisma.account.findMany).mockResolvedValue(testAccounts as any);
      
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('account-id-1');
      expect(response.body[1].id).toBe('account-id-2');
      
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId: testUser.id }
      });
    });
    
    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/accounts');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/accounts/:id', () => {
    it('should return a specific account', async () => {
      // Mock Prisma findUnique to return a specific account
      vi.mocked(prisma.account.findUnique).mockResolvedValue(testAccounts[0] as any);
      
      const response = await request(app)
        .get('/api/accounts/account-id-1')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'account-id-1');
      expect(response.body).toHaveProperty('name', 'Checking Account');
      
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-id-1' }
      });
    });
    
    it('should return 404 if account not found', async () => {
      // Mock Prisma findUnique to return null
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/accounts/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Account not found');
    });
    
    it('should return 403 if account belongs to another user', async () => {
      // Mock Prisma findUnique to return an account with a different user ID
      vi.mocked(prisma.account.findUnique).mockResolvedValue({
        ...testAccounts[0],
        userId: 'different-user-id'
      } as any);
      
      const response = await request(app)
        .get('/api/accounts/account-id-1')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Not authorized');
    });
  });
  
  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const newAccount = {
        name: 'New Account',
        type: 'debit',
        balance: 500,
        institution: 'New Bank',
        lastFour: '9876',
        color: '#10B981'
      };
      
      const createdAccount = {
        id: 'new-account-id',
        ...newAccount,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock Prisma create to return the created account
      vi.mocked(prisma.account.create).mockResolvedValue(createdAccount as any);
      
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newAccount);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-account-id');
      expect(response.body).toHaveProperty('name', 'New Account');
      
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Account',
          type: 'debit',
          balance: 500,
          userId: testUser.id
        })
      });
    });
    
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'New Account',
          type: 'debit',
          balance: 500
        });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('PUT /api/accounts/:id', () => {
    it('should update an account', async () => {
      // Mock Prisma findUnique to return an account
      vi.mocked(prisma.account.findUnique).mockResolvedValue(testAccounts[0] as any);
      
      const updatedAccount = {
        ...testAccounts[0],
        name: 'Updated Account',
        balance: 1500
      };
      
      // Mock Prisma update to return the updated account
      vi.mocked(prisma.account.update).mockResolvedValue(updatedAccount as any);
      
      const response = await request(app)
        .put('/api/accounts/account-id-1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Updated Account',
          balance: 1500
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Account');
      expect(response.body).toHaveProperty('balance', 1500);
      
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-id-1' },
        data: expect.objectContaining({
          name: 'Updated Account',
          balance: 1500
        })
      });
    });
    
    it('should return 404 if account not found', async () => {
      // Mock Prisma findUnique to return null
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/accounts/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Updated Account'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Account not found');
    });
  });
  
  describe('DELETE /api/accounts/:id', () => {
    it('should delete an account', async () => {
      // Mock Prisma findUnique to return an account
      vi.mocked(prisma.account.findUnique).mockResolvedValue(testAccounts[0] as any);
      
      // Mock Prisma delete to return the deleted account
      vi.mocked(prisma.account.delete).mockResolvedValue(testAccounts[0] as any);
      
      const response = await request(app)
        .delete('/api/accounts/account-id-1')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(204);
      
      expect(prisma.account.delete).toHaveBeenCalledWith({
        where: { id: 'account-id-1' }
      });
    });
    
    it('should return 404 if account not found', async () => {
      // Mock Prisma findUnique to return null
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);
      
      const response = await request(app)
        .delete('/api/accounts/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Account not found');
    });
  });
  
  describe('GET /api/accounts/:id/transactions', () => {
    it('should return transactions for an account', async () => {
      // Mock Prisma findUnique to return an account
      vi.mocked(prisma.account.findUnique).mockResolvedValue(testAccounts[0] as any);
      
      // Mock Prisma findMany to return transactions
      vi.mocked(prisma.transaction.findMany).mockResolvedValue(testTransactions as any);
      
      const response = await request(app)
        .get('/api/accounts/account-id-1/transactions')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('trans-id-1');
      
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { 
          accountId: 'account-id-1',
          userId: testUser.id 
        },
        orderBy: { date: 'desc' },
        take: 35
      });
    });
    
    it('should return 404 if account not found', async () => {
      // Mock Prisma findUnique to return null
      vi.mocked(prisma.account.findUnique).mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/accounts/non-existent-id/transactions')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Account not found');
    });
  });
}); 