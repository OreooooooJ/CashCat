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
  // Set a default test user for development with the correct ID from the database
  req.user = {
    id: "2e875360-dc75-43ea-a2d4-1a61b6a3bed2",
    email: "test@example.com"
  };
  
  console.log('Using hardcoded user ID:', req.user.id);
  
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

// Get all bank accounts for the authenticated user
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
    
    // Map legacy 'debit' type to 'checking' for client compatibility
    const mappedAccounts = accounts.map(account => {
      if (account.type === 'debit') {
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

// Add a test endpoint to directly query the database
app.get('/api/test/transactions', async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Querying transactions directly');
    
    // Query all transactions
    const transactions = await prisma.transaction.findMany({
      take: 10
    });
    
    console.log(`TEST ENDPOINT: Found ${transactions.length} transactions`);
    
    // Query transactions for the specific user ID from our test
    const userTransactions = await prisma.transaction.findMany({
      where: { userId: '2e875360-dc75-43ea-a2d4-1a61b6a3bed2' },
      take: 10
    });
    
    console.log(`TEST ENDPOINT: Found ${userTransactions.length} transactions for user 2e875360-dc75-43ea-a2d4-1a61b6a3bed2`);
    
    res.json({
      allTransactions: transactions,
      userTransactions: userTransactions
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error querying transactions:', error);
    res.status(500).json({ error: 'Failed to query transactions' });
  }
});

// Add a test endpoint to directly query the database for accounts
app.get('/api/test/accounts', async (req, res) => {
  try {
    console.log('TEST ENDPOINT: Querying accounts directly');
    
    // Query all accounts
    const accounts = await prisma.account.findMany({
      take: 10
    });
    
    console.log(`TEST ENDPOINT: Found ${accounts.length} accounts`);
    
    // Query accounts for the specific user ID from our test
    const userAccounts = await prisma.account.findMany({
      where: { userId: '2e875360-dc75-43ea-a2d4-1a61b6a3bed2' },
      take: 10
    });
    
    console.log(`TEST ENDPOINT: Found ${userAccounts.length} accounts for user 2e875360-dc75-43ea-a2d4-1a61b6a3bed2`);
    
    res.json({
      allAccounts: accounts,
      userAccounts: userAccounts
    });
  } catch (error) {
    console.error('TEST ENDPOINT: Error querying accounts:', error);
    res.status(500).json({ error: 'Failed to query accounts' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 