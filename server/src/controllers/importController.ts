import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { importCsvTransactions } from '../services/csvImportService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Define a custom user type
interface User {
  id: string;
  email: string;
}

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: User;
  file?: Express.Multer.File;
}

/**
 * Handle CSV import request
 */
export const importCsv = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('Starting CSV import process...');
    const userId = req.user?.id;
    
    if (!userId) {
      console.log('Import failed: User not authenticated');
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!req.file) {
      console.log('Import failed: No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    console.log(`File uploaded: ${req.file.originalname}, saved as: ${req.file.filename}`);
    console.log(`File path: ${req.file.path}`);
    
    const { accountId, formatName } = req.body;
    console.log(`Import parameters: accountId=${accountId}, formatName=${formatName || 'auto-detect'}`);
    
    if (!accountId) {
      console.log('Import failed: Account ID is required');
      res.status(400).json({ error: 'Account ID is required' });
      return;
    }
    
    // Check if account belongs to user
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });
      
      if (!account) {
        console.log(`Import failed: Account not found with ID ${accountId}`);
        res.status(404).json({ error: 'Account not found' });
        return;
      }
      
      if (account.userId !== userId) {
        console.log(`Import failed: User ${userId} not authorized to access account ${accountId}`);
        res.status(403).json({ error: 'Not authorized to access this account' });
        return;
      }
      
      console.log(`Account verified: ${account.name} (${account.type})`);
    } catch (accountError) {
      console.error('Error verifying account:', accountError);
      res.status(500).json({ error: 'Failed to verify account' });
      return;
    }
    
    // Verify file exists
    if (!fs.existsSync(req.file.path)) {
      console.log(`Import failed: File not found at ${req.file.path}`);
      res.status(400).json({ error: 'Uploaded file not found' });
      return;
    }
    
    // Import transactions from CSV
    try {
      console.log('Starting CSV import...');
      const transactions = await importCsvTransactions(
        req.file.path,
        userId,
        accountId,
        formatName
      );
      
      console.log(`Import successful: ${transactions.length} transactions imported`);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({
        message: `Successfully imported ${transactions.length} transactions`,
        transactions
      });
    } catch (importError) {
      console.error('Error during CSV import:', importError);
      
      // Clean up uploaded file if it exists
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: 'Failed to import transactions',
        message: importError instanceof Error ? importError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Unexpected error in import controller:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to import transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 