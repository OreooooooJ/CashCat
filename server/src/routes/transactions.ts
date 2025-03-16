import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { processTransaction, updateTransactionCategory } from '../services/transactionProcessingService';
import { getSupportedFormats } from '../services/csvImportService';
import { importCsv } from '../controllers/importController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { updateAccountBalanceForTransaction } from '../services/accountBalanceService';

const router = express.Router();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const csvUpload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed') as any);
    }
  }
});

// Get all transactions for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
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

// Get a specific transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { amount, type, description, date, accountId } = req.body;
    console.log('Creating transaction:', { amount, type, description, date, accountId });
    
    // If this is a credit card account, we need to handle the transaction type differently
    if (accountId) {
      try {
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { type: true }
        });
        
        console.log('Account type for transaction:', account?.type);
        
        // For credit card accounts, we should override the type based on our business logic
        if (account && account.type.toLowerCase() === 'credit') {
          console.log('Credit card transaction detected, original type:', type);
          
          // For credit cards, expenses should be 'expense', not 'income'
          if (type === 'INCOME' || type === 'income') {
            console.log('Overriding credit card transaction type to expense');
            req.body.type = 'expense';
          }
        }
      } catch (accountError) {
        console.error('Error fetching account type:', accountError);
      }
    }
    
    // Process the transaction to determine the category
    const processedTransaction = processTransaction({ 
      amount, 
      type: req.body.type, // Use potentially updated type
      description, 
      date, 
      accountId 
    }, userId);
    
    console.log('Processed transaction:', processedTransaction);
    
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type: req.body.type, // Use potentially updated type
        category: processedTransaction.category,
        description,
        date: date ? new Date(date) : new Date(),
        userId,
        accountId: accountId || null,
      },
    });
    
    console.log('Created transaction:', transaction);
    
    // Update account balance if this transaction is linked to an account
    if (accountId) {
      await updateAccountBalanceForTransaction(
        accountId,
        transaction.type,
        transaction.amount,
        true // This is an addition
      );
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update a transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the existing transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (existingTransaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { amount, type, description, date, category, accountId } = req.body;
    
    // If account ID is changing, we need to update both accounts
    const isAccountChanging = accountId !== undefined && accountId !== existingTransaction.accountId;
    
    // First, remove the transaction from the old account's balance
    if (existingTransaction.accountId) {
      await updateAccountBalanceForTransaction(
        existingTransaction.accountId,
        existingTransaction.type,
        existingTransaction.amount,
        false // This is a removal
      );
    }
    
    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        type,
        category,
        description,
        date: date ? new Date(date) : undefined,
        accountId: accountId || null,
      },
    });
    
    // Add the transaction to the new account's balance
    if (updatedTransaction.accountId) {
      await updateAccountBalanceForTransaction(
        updatedTransaction.accountId,
        updatedTransaction.type,
        updatedTransaction.amount,
        true // This is an addition
      );
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the transaction before deleting it
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Update account balance if this transaction is linked to an account
    if (transaction.accountId) {
      await updateAccountBalanceForTransaction(
        transaction.accountId,
        transaction.type,
        transaction.amount,
        false // This is a removal
      );
    }
    
    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get supported CSV formats
router.get('/import/formats', authenticateToken, (req, res) => {
  try {
    const formats = getSupportedFormats();
    res.json(formats);
  } catch (error) {
    console.error('Error fetching supported formats:', error);
    res.status(500).json({ error: 'Failed to fetch supported formats' });
  }
});

// Import transactions from CSV
router.post('/import', authenticateToken, (req, res, next) => {
  // @ts-expect-error - Ignoring type issues with multer
  csvUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, importCsv);

export default router; 