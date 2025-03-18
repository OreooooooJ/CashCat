import { PrismaClient } from '@prisma/client';
import { processTransaction } from './transactionProcessingService';
import { updateAccountBalanceForTransaction } from './accountBalanceService';
import { 
  formatAmount, 
  formatDescription, 
  formatCategory,
  standardizeTransaction,
  standardizeStagingTransaction
} from '../utils/formatUtils.js';

const prisma = new PrismaClient();

/**
 * Create a staging transaction from CSV data
 * @param rawData Raw CSV data as a string
 * @param parsedData Parsed transaction data
 * @param userId User ID to associate with the transaction
 * @param accountId Account ID to associate with the transaction
 * @param source Source of the transaction (e.g., 'csv', 'manual', 'api')
 * @param bankName Optional bank name
 * @returns The created staging transaction
 */
export const createStagingTransaction = async (
  rawData: string,
  parsedData: {
    amount: number;
    type: string;
    description?: string;
    date: Date;
    category?: string;
  },
  userId: string,
  accountId: string | null,
  source: string,
  bankName?: string
) => {
  try {
    // Process transaction to determine category if not provided
    let category = parsedData.category;
    if (!category) {
      const processedTransaction = processTransaction(parsedData, userId);
      category = processedTransaction.category;
    }

    // Format the data
    const formattedData = {
      rawData,
      amount: formatAmount(parsedData.amount),
      type: parsedData.type.toLowerCase(),
      category: formatCategory(category || ''),
      description: formatDescription(parsedData.description || ''),
      date: parsedData.date,
      bankName: bankName ? formatDescription(bankName) : undefined,
      source: source.toLowerCase(),
      userId,
      accountId,
    };

    // Create staging transaction
    const stagingTransaction = await prisma.stagingTransaction.create({
      data: formattedData,
    });

    return stagingTransaction;
  } catch (error) {
    console.error('Error creating staging transaction:', error);
    throw error;
  }
};

/**
 * Process staging transactions and move them to the main Transaction table
 * @param stagingIds Array of staging transaction IDs to process
 * @param userId User ID for authorization check
 * @returns The created transactions
 */
export const processStagingTransactions = async (
  stagingIds: string[],
  userId: string
) => {
  try {
    // Get staging transactions
    const stagingTransactions = await prisma.stagingTransaction.findMany({
      where: {
        id: { in: stagingIds },
        userId, // Ensure user owns these transactions
      },
    });

    if (stagingTransactions.length === 0) {
      throw new Error('No valid staging transactions found');
    }

    // Create transactions in a transaction to ensure atomicity
    const createdTransactions = await prisma.$transaction(async (tx) => {
      const transactions = [];

      for (const staging of stagingTransactions) {
        // Create standardized transaction data
        const transactionData = {
          amount: staging.amount,
          type: staging.type,
          category: staging.category || 'Other',
          description: staging.description,
          date: staging.date,
          userId: staging.userId,
          accountId: staging.accountId,
        };

        // Standardize the transaction data
        const standardizedTransaction = standardizeTransaction(transactionData);

        // Create transaction
        const transaction = await tx.transaction.create({
          data: standardizedTransaction,
        });

        transactions.push(transaction);

        // Update account balance if account is specified
        if (staging.accountId) {
          await updateAccountBalanceForTransaction(
            staging.accountId,
            staging.type,
            staging.amount,
            true // This is an addition
          );
        }

        // Delete the staging transaction
        await tx.stagingTransaction.delete({
          where: { id: staging.id },
        });
      }

      return transactions;
    });

    return createdTransactions;
  } catch (error) {
    console.error('Error processing staging transactions:', error);
    throw error;
  }
};

/**
 * Get all staging transactions for a user
 * @param userId User ID
 * @returns Array of staging transactions
 */
export const getStagingTransactions = async (userId: string) => {
  try {
    const stagingTransactions = await prisma.stagingTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return stagingTransactions;
  } catch (error) {
    console.error('Error fetching staging transactions:', error);
    throw error;
  }
};

/**
 * Delete staging transactions
 * @param stagingIds Array of staging transaction IDs to delete
 * @param userId User ID for authorization check
 * @returns Count of deleted transactions
 */
export const deleteStagingTransactions = async (
  stagingIds: string[],
  userId: string
) => {
  try {
    const result = await prisma.stagingTransaction.deleteMany({
      where: {
        id: { in: stagingIds },
        userId, // Ensure user owns these transactions
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error deleting staging transactions:', error);
    throw error;
  }
}; 