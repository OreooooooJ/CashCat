import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all bank accounts for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log('🔍 BANK ACCOUNTS API: GET /accounts - User ID:', userId);
    
    if (!userId) {
      console.log('🔍 BANK ACCOUNTS API: No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('🔍 BANK ACCOUNTS API: Fetching bank accounts for user:', userId);
    console.log('🔍 BANK ACCOUNTS API: Query parameters:', { 
      where: { userId },
      orderBy: { name: 'asc' }
    });
    
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    
    console.log(`🔍 BANK ACCOUNTS API: Found ${accounts.length} bank accounts for user ${userId}`);
    
    // Map legacy 'debit' type to 'checking' for client compatibility
    const mappedAccounts = accounts.map(account => {
      if (account.type === 'debit') {
        console.log(`🔍 BANK ACCOUNTS API: Mapping 'debit' to 'checking' for account ${account.id}`);
        return {
          ...account,
          type: 'checking'
        };
      }
      return account;
    });
    
    res.json(mappedAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

// Get a specific bank account
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const account = await prisma.account.findUnique({
      where: { id },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Map legacy 'debit' type to 'checking' for client compatibility
    const mappedAccount = account.type === 'debit' 
      ? { ...account, type: 'checking' } 
      : account;
    
    res.json(mappedAccount);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ error: 'Failed to fetch bank account' });
  }
});

// Get transactions for a specific bank account
router.get('/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam.toString()) : 35;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const account = await prisma.account.findUnique({
      where: { id },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { 
        accountId: id,
        userId 
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching bank account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch bank account transactions' });
  }
});

// Create a new bank account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { name, type, balance, institution, lastFour, color } = req.body;
    
    // Validate account type
    const validTypes = ['checking', 'savings', 'credit', 'investment'];
    const accountType = type === 'debit' ? 'checking' : type;
    
    if (!validTypes.includes(accountType)) {
      return res.status(400).json({ 
        error: 'Invalid account type. Must be one of: checking, savings, credit, investment' 
      });
    }
    
    const account = await prisma.account.create({
      data: {
        name,
        type: accountType,
        balance: parseFloat(balance),
        institution,
        lastFour,
        color,
        userId,
      },
    });
    
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: 'Failed to create bank account' });
  }
});

// Update a bank account
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const account = await prisma.account.findUnique({
      where: { id },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { name, type, balance, institution, lastFour, color } = req.body;
    
    // Validate account type if provided
    let accountType = type;
    if (type) {
      const validTypes = ['checking', 'savings', 'credit', 'investment'];
      accountType = type === 'debit' ? 'checking' : type;
      
      if (!validTypes.includes(accountType)) {
        return res.status(400).json({ 
          error: 'Invalid account type. Must be one of: checking, savings, credit, investment' 
        });
      }
    }
    
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        type: accountType,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        institution,
        lastFour,
        color,
      },
    });
    
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

// Delete a bank account
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const account = await prisma.account.findUnique({
      where: { id },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.account.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

export default router; 