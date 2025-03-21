import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a write stream to our log file
const logFile = fs.createWriteStream(path.join(__dirname, 'logs.txt'), { flags: 'a' });

// Capture console output for debugging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  const logMessage = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  logFile.write(`[${new Date().toISOString()}] LOG: ${logMessage}\n`);
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const logMessage = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  logFile.write(`[${new Date().toISOString()}] ERROR: ${logMessage}\n`);
  originalConsoleError.apply(console, args);
};

// Define supported bank formats directly in the server.js file
const bankFormats = [
  {
    name: 'Chase',
    detectionHeaders: ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount']
  },
  {
    name: 'Bank of America',
    detectionHeaders: ['Date', 'Description', 'Amount', 'Running Bal.']
  },
  {
    name: 'Wells Fargo',
    detectionHeaders: ['Date', 'Amount', 'Description', 'Balance']
  }
];

// Implement getSupportedFormats directly
function getSupportedFormats() {
  console.log('🔍 CSV SERVICE: getSupportedFormats called directly in server.js');
  const formats = bankFormats.map(format => format.name);
  console.log('🔍 CSV SERVICE: Returning formats:', formats);
  return formats;
}

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// More permissive CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev server default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

// Move formats endpoint registration above other routes to avoid conflicts
// Add a direct endpoint for supported formats
app.get('/api/transactions/import/formats', authenticateToken, (req, res) => {
  try {
    console.log('🔍 DIRECT ENDPOINT: GET /api/transactions/import/formats - Request received');
    const formats = getSupportedFormats();
    console.log('🔍 DIRECT ENDPOINT: Supported formats:', formats);
    res.json(formats);
  } catch (error) {
    console.error('🔍 DIRECT ENDPOINT: Error getting supported formats:', error);
    res.status(500).json({ error: 'Failed to get supported formats' });
  }
});

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

// Define auth router directly in server.js
const authRouter = express.Router();

// Login route
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Name, email, and password (min 6 characters) are required' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register API routes (use the local authRouter)
app.use('/auth', authRouter);

// Budget routes implementation directly in server.js
// Define budget routes
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const budgets = await prisma.budget.findMany({
      where: { userId },
    });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { category, amount, period } = req.body;
    
    const budget = await prisma.budget.create({
      data: {
        category,
        amount: parseFloat(amount),
        spent: 0,
        period,
        userId,
      },
    });
    
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { amount, spent, period } = req.body;
    
    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (budget.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateData = {};
    
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (spent !== undefined) updateData.spent = parseFloat(spent);
    if (period !== undefined) updateData.period = period;
    
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
    });
    
    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const budget = await prisma.budget.findUnique({
      where: { id },
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (budget.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.budget.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 