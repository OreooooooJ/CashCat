import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug route to get user ID
app.get('/debug/user', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Temporary authentication middleware
const authenticateToken = (req, res, next) => {
  // Set a default test user for development
  req.user = {
    id: "bbe33afd-2c48-4ccc-9c96-060fdfe6be2e",
    email: "test@example.com"
  };
  
  // Continue to the next middleware/route handler
  next();
};

// Get all transactions for the authenticated user
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam.toString()) : 100;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all accounts for the authenticated user
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 