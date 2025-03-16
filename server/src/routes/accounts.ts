import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all accounts for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log('GET /accounts - User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('Attempting to fetch accounts for user:', userId);
    console.log('Prisma client:', Object.keys(prisma));
    
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });
      
      console.log('Accounts fetched successfully:', accounts);
      res.json(accounts);
    } catch (dbError) {
      console.error('Database error when fetching accounts:', dbError);
      res.status(500).json({ error: 'Database error when fetching accounts' });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get a specific account
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
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Get transactions for a specific account
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
      return res.status(404).json({ error: 'Account not found' });
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
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch account transactions' });
  }
});

// Create a new account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { name, type, balance, institution, lastFour, color } = req.body;
    
    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: parseFloat(balance),
        institution,
        lastFour,
        color,
        userId,
      },
    });
    
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update an account
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
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { name, type, balance, institution, lastFour, color } = req.body;
    
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        institution,
        lastFour,
        color,
      },
    });
    
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete an account
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
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.account.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router; 