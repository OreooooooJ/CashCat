import { Request, Response } from 'express';
import { 
  getStagingTransactions, 
  processStagingTransactions, 
  deleteStagingTransactions 
} from '../services/stagingTransactionService';

// Define a custom user type
interface User {
  id: string;
  email: string;
}

// Extend the Request type to include the authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Get all staging transactions for the authenticated user
 * @param req Request object
 * @param res Response object
 */
export const getAllStagingTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const stagingTransactions = await getStagingTransactions(userId);
    
    res.status(200).json(stagingTransactions);
  } catch (error) {
    console.error('Error fetching staging transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staging transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process selected staging transactions and move them to the main Transaction table
 * @param req Request object with stagingIds in the body
 * @param res Response object
 */
export const processSelectedStagingTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { stagingIds } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!stagingIds || !Array.isArray(stagingIds) || stagingIds.length === 0) {
      res.status(400).json({ error: 'No staging transaction IDs provided' });
      return;
    }
    
    const transactions = await processStagingTransactions(stagingIds, userId);
    
    res.status(200).json({
      message: `Successfully processed ${transactions.length} transactions`,
      transactions
    });
  } catch (error) {
    console.error('Error processing staging transactions:', error);
    res.status(500).json({ 
      error: 'Failed to process staging transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete selected staging transactions
 * @param req Request object with stagingIds in the body
 * @param res Response object
 */
export const deleteSelectedStagingTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { stagingIds } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!stagingIds || !Array.isArray(stagingIds) || stagingIds.length === 0) {
      res.status(400).json({ error: 'No staging transaction IDs provided' });
      return;
    }
    
    const deletedCount = await deleteStagingTransactions(stagingIds, userId);
    
    res.status(200).json({
      message: `Successfully deleted ${deletedCount} staging transactions`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting staging transactions:', error);
    res.status(500).json({ 
      error: 'Failed to delete staging transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 