import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { processTransaction } from './transactionProcessingService';
import { updateAccountBalanceForTransaction } from './accountBalanceService';
import { createStagingTransaction } from './stagingTransactionService';
import { 
  formatAmount, 
  formatDescription, 
  formatCategory,
  standardizeTransaction,
  standardizeStagingTransaction
} from '../utils/formatUtils.js';

const prisma = new PrismaClient();

// Define interfaces for our CSV mapping system
interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  category?: string;
  accountNumber?: string;
}

// Updated BankFormat interface with dateFormat and amountFormat
interface BankFormat {
  name: string;
  columnMapping: ColumnMapping;
  dateFormat: string;
  amountFormat: string;
  detectionHeaders: string[];
}

// Define interface for transaction data
interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  userId: string;
  accountId: string;
}

// Helper functions for parsing CSV data
const parseDate = (dateStr: string, format: string): Date => {
  // Simple date parsing based on format
  // In a real implementation, you would use a library like date-fns or moment
  try {
    // Default to current date if parsing fails
    if (!dateStr) return new Date();
    
    // Basic implementation - assumes format is MM/DD/YYYY or YYYY-MM-DD
    if (format === 'MM/DD/YYYY') {
      const [month, day, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (format === 'YYYY-MM-DD') {
      return new Date(dateStr);
    } else {
      // Default fallback
      return new Date(dateStr);
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

const parseAmount = (amountStr: string, format: string): number => {
  try {
    // Remove currency symbols, commas, etc.
    let cleanAmount = amountStr.replace(/[$,]/g, '');
    
    // Handle different formats
    if (format === 'negative-expense') {
      // Negative numbers are expenses (e.g., -10.00 is an expense)
      return formatAmount(parseFloat(cleanAmount));
    } else if (format === 'parentheses-expense') {
      // Amounts in parentheses are expenses (e.g., (10.00) is an expense)
      if (cleanAmount.startsWith('(') && cleanAmount.endsWith(')')) {
        cleanAmount = '-' + cleanAmount.substring(1, cleanAmount.length - 1);
      }
      return formatAmount(parseFloat(cleanAmount));
    } else {
      // Default: just parse as float
      return formatAmount(parseFloat(cleanAmount));
    }
  } catch (error) {
    console.error('Error parsing amount:', error);
    return 0;
  }
};

// Use our formatDescription utility instead of this function
const cleanDescription = formatDescription;

// Define bank formats
const bankFormats: BankFormat[] = [
  {
    name: 'Chase',
    columnMapping: {
      date: 'Transaction Date',
      description: 'Description',
      amount: 'Amount',
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'negative-expense',
    detectionHeaders: ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo']
  },
  {
    name: 'Bank of America',
    columnMapping: {
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'negative-expense',
    detectionHeaders: ['Date', 'Description', 'Amount', 'Running Bal.']
  },
  {
    name: 'Wells Fargo',
    columnMapping: {
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'parentheses-expense',
    detectionHeaders: ['Date', 'Amount', 'Description', 'Balance']
  }
];

/**
 * Detect the bank format from CSV headers
 * @param headers Array of CSV headers
 * @returns The detected bank format or undefined if not detected
 */
const detectFormat = (headers: string[]): BankFormat | undefined => {
  // Convert headers to lowercase for case-insensitive matching
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Find a format where all detection headers are present
  return bankFormats.find(format => {
    const requiredHeaders = format.detectionHeaders.map(h => h.toLowerCase());
    return requiredHeaders.every(header => lowerHeaders.includes(header));
  });
};

/**
 * Register a new bank format
 * @param format The bank format to register
 */
export const registerBankFormat = (format: BankFormat): void => {
  bankFormats.push(format);
};

/**
 * Check if a transaction already exists in the database
 * @param transaction Transaction to check
 * @param userId User ID
 * @returns Promise resolving to boolean indicating if transaction exists
 */
const checkDuplicateTransaction = async (transaction: TransactionData, userId: string): Promise<boolean> => {
  // Look for transactions with the same date, amount, description, and user
  const transactionDate = transaction.date;
  
  // Create a date range for the check (same day)
  const startDate = new Date(transactionDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(transactionDate);
  endDate.setHours(23, 59, 59, 999);
  
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      amount: transaction.amount,
      description: transaction.description,
      userId: userId,
      accountId: transaction.accountId
    }
  });
  
  if (existingTransaction) {
    console.log(`Found duplicate transaction: ${transaction.description} on ${transaction.date.toISOString().split('T')[0]} for $${transaction.amount}`);
    return true;
  }
  
  return false;
};

/**
 * Process a CSV file and import transactions to staging
 * @param filePath Path to the CSV file
 * @param userId User ID to associate with transactions
 * @param accountId Account ID to associate with transactions
 * @param formatName Optional format name to use (if not auto-detected)
 * @returns Promise resolving to the imported staging transactions
 */
export const importCsvTransactions = async (
  filePath: string,
  userId: string,
  accountId: string,
  formatName?: string
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const headers: string[] = [];
    let format: BankFormat | undefined;
    
    // Get account type to determine transaction type logic
    let accountType: string;
    
    (async () => {
      try {
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { type: true, institution: true }
        });
        
        if (!account) {
          return reject(new Error(`Account not found with ID: ${accountId}`));
        }
        
        accountType = account.type.toLowerCase();
        console.log(`Account type for import: ${accountType}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return reject(new Error(`File not found at path: ${filePath}`));
        }
        
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headerList) => {
            // Store headers for format detection
            headerList.forEach(header => headers.push(header));
            
            // Try to detect format or use provided format
            if (formatName) {
              format = bankFormats.find(f => f.name === formatName);
              if (!format) {
                return reject(new Error(`Unknown format: ${formatName}`));
              }
            } else {
              format = detectFormat(headers);
              if (!format) {
                return reject(new Error('Could not auto-detect CSV format. Please specify a format.'));
              }
            }
            
            console.log(`Using format: ${format.name}`);
          })
          .on('data', async (data) => {
            if (!format) return;
            
            try {
              // Extract data using the format's column mapping
              const mapping = format.columnMapping;
              
              // Get date
              const dateStr = data[mapping.date];
              const date = parseDate(dateStr, format.dateFormat);
              
              // Get description
              const description = data[mapping.description] || '';
              const transformedDescription = formatDescription(description);
              
              // Get amount
              const amountStr = data[mapping.amount];
              const amount = parseAmount(amountStr, format.amountFormat);
              
              // Determine transaction type based on account type and amount
              let type: string;
              
              if (accountType === 'credit') {
                // For credit cards: positive = expense, negative = income (payment)
                type = amount > 0 ? 'expense' : 'income';
              } else {
                // For debit accounts: positive = income, negative = expense
                type = amount > 0 ? 'income' : 'expense';
              }
              
              // Create transaction object
              const transaction = {
                amount: Math.abs(amount), // Store absolute amount
                type,
                description: transformedDescription,
                date,
                userId,
                accountId
              };
              
              // Process transaction to determine category
              const processedTransaction = processTransaction(transaction, userId);
              
              // Create a staging transaction
              const rawData = JSON.stringify(data); // Store the entire CSV row as JSON
              
              // Create standardized transaction data
              const transactionData = {
                amount: Math.abs(amount),
                type,
                description: transformedDescription,
                date,
                category: processedTransaction.category,
                userId,
                accountId,
                bankName: account.institution || undefined,
                source: 'csv',
                rawData
              };
              
              // Standardize the transaction data
              const standardizedTransaction = standardizeStagingTransaction(transactionData);
              
              const stagingTransaction = await createStagingTransaction(
                rawData,
                {
                  amount: standardizedTransaction.amount,
                  type: standardizedTransaction.type,
                  description: standardizedTransaction.description,
                  date: standardizedTransaction.date,
                  category: standardizedTransaction.category
                },
                userId,
                accountId,
                'csv',
                standardizedTransaction.bankName
              );
              
              // Add to results
              results.push(stagingTransaction);
            } catch (error) {
              console.error('Error processing CSV row:', error);
              // Continue processing other rows
            }
          })
          .on('end', async () => {
            try {
              console.log(`Finished processing CSV. Created ${results.length} staging transactions.`);
              
              if (results.length === 0) {
                return resolve([]);
              }
              
              resolve(results);
            } catch (error) {
              console.error('Error saving staging transactions to database:', error);
              reject(error);
            }
          })
          .on('error', (error) => {
            console.error('CSV parsing error:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Error fetching account type:', error);
        return reject(new Error('Failed to fetch account type'));
      }
    })();
  });
};

/**
 * Get all supported bank formats
 * @returns Array of supported bank format names
 */
export const getSupportedFormats = (): string[] => {
  console.log('🔍 CSV SERVICE: getSupportedFormats called');
  const formats = bankFormats.map(format => format.name);
  console.log('🔍 CSV SERVICE: Returning formats:', formats);
  return formats;
}; 