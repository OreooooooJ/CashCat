import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { processTransaction } from './transactionProcessingService';
import { updateAccountBalanceForTransaction } from './accountBalanceService';

const prisma = new PrismaClient();

// Define interfaces for our CSV mapping system
interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  category?: string;
  accountNumber?: string;
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

interface Transformation {
  date: (value: string) => Date;
  amount: (value: string) => number;
  type: (value: number) => 'income' | 'expense';
  description?: (value: string) => string;
}

interface BankFormat {
  name: string;
  detection: (headers: string[]) => boolean;
  columnMapping: ColumnMapping;
  transformation: Transformation;
}

// Define bank formats
const bankFormats: BankFormat[] = [
  {
    name: 'Amex',
    detection: (headers) => 
      headers.includes('Date') && 
      headers.includes('Description') && 
      headers.includes('Card Member') && 
      headers.includes('Amount'),
    columnMapping: {
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      category: 'Category',
      accountNumber: 'Account #'
    },
    transformation: {
      date: (value) => new Date(value),
      amount: (value) => parseFloat(value),
      type: (amount) => amount > 0 ? 'expense' : 'income',
      description: (value) => value.trim()
    }
  },
  {
    name: 'Chase',
    detection: (headers) => 
      headers.includes('Date') && 
      headers.includes('Description') && 
      headers.includes('Amount') &&
      headers.includes('Card Member'),
    columnMapping: {
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      accountNumber: 'Account #'
    },
    transformation: {
      date: (value) => new Date(value),
      amount: (value) => {
        // Chase typically uses negative for expenses, positive for income
        return parseFloat(value.replace('$', '').replace(',', ''));
      },
      type: (amount) => amount < 0 ? 'expense' : 'income',
      description: (value) => value.trim()
    }
  },
  {
    name: 'Bank of America',
    detection: (headers) => 
      headers.includes('Date') && 
      headers.includes('Description') && 
      headers.includes('Amount') && 
      headers.includes('Running Bal.'),
    columnMapping: {
      date: 'Date',
      description: 'Description',
      amount: 'Amount'
    },
    transformation: {
      date: (value) => new Date(value),
      amount: (value) => {
        // Bank of America typically uses negative for expenses, positive for income
        return parseFloat(value.replace('$', '').replace(',', ''));
      },
      type: (amount) => amount < 0 ? 'expense' : 'income'
    }
  }
];

/**
 * Detect the bank format from CSV headers
 * @param headers CSV headers
 * @returns The detected bank format or undefined if not detected
 */
const detectFormat = (headers: string[]): BankFormat | undefined => {
  return bankFormats.find(format => format.detection(headers));
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
 * Process a CSV file and import transactions
 * @param filePath Path to the CSV file
 * @param userId User ID to associate with transactions
 * @param accountId Account ID to associate with transactions
 * @param formatName Optional format name to use (if not auto-detected)
 * @returns Promise resolving to the imported transactions
 */
export const importCsvTransactions = async (
  filePath: string,
  userId: string,
  accountId: string,
  formatName?: string
): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    const results: TransactionData[] = [];
    const headers: string[] = [];
    let format: BankFormat | undefined;
    let skippedDuplicates = 0;
    
    // Get account type to determine transaction type logic
    let accountType: string;
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { type: true }
      });
      
      if (!account) {
        return reject(new Error(`Account not found with ID: ${accountId}`));
      }
      
      accountType = account.type.toLowerCase();
      console.log(`Account type for import: ${accountType}`);
    } catch (error) {
      console.error('Error fetching account type:', error);
      return reject(new Error('Failed to fetch account type'));
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found at path: ${filePath}`));
    }
    
    // Create read stream for CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (csvHeaders) => {
        try {
          // Store headers for format detection
          headers.push(...csvHeaders);
          console.log('CSV Headers:', headers);
          
          // Detect format or use specified format
          if (formatName) {
            format = bankFormats.find(f => f.name === formatName);
            console.log(`Using specified format: ${formatName}, found:`, !!format);
          } else {
            format = detectFormat(headers);
            console.log('Auto-detected format:', format?.name || 'None');
          }
          
          if (!format) {
            reject(new Error('Unsupported CSV format. Could not detect bank format.'));
          }
        } catch (headerError) {
          console.error('Error processing CSV headers:', headerError);
          reject(headerError);
        }
      })
      .on('data', (data) => {
        if (!format) return;
        
        try {
          // Map CSV row to transaction data
          const { columnMapping, transformation } = format;
          
          // Extract values using column mapping
          const dateStr = data[columnMapping.date];
          const description = data[columnMapping.description];
          const amountStr = data[columnMapping.amount];
          
          // Skip rows with missing required data
          if (!dateStr || !description || !amountStr) {
            console.log('Skipping row with missing data:', { dateStr, description, amountStr });
            return;
          }
          
          // Apply transformations
          const date = transformation.date(dateStr);
          const amount = transformation.amount(amountStr);
          const transformedDescription = transformation.description 
            ? transformation.description(description) 
            : description;
          
          // Determine transaction type based on account type and amount
          let type: 'income' | 'expense';
          
          if (accountType === 'credit') {
            // For credit cards: positive = expense, negative = income (payment)
            // This is because credit card purchases (expenses) increase the balance (positive)
            // while payments (income) decrease the balance (negative)
            console.log(`Credit card transaction: ${transformedDescription}, amount: ${amount}, setting type to: ${amount > 0 ? 'expense' : 'income'}`);
            type = amount > 0 ? 'expense' : 'income';
          } else {
            // For debit accounts: positive = income, negative = expense
            // This is because deposits (income) increase the balance (positive)
            // while purchases (expenses) decrease the balance (negative)
            console.log(`Debit account transaction: ${transformedDescription}, amount: ${amount}, setting type to: ${amount > 0 ? 'income' : 'expense'}`);
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
          
          // Add to results
          results.push({
            ...transaction,
            category: processedTransaction.category
          });
        } catch (error) {
          console.error('Error processing CSV row:', error);
          // Continue processing other rows
        }
      })
      .on('end', async () => {
        try {
          console.log(`Finished processing CSV. Found ${results.length} valid transactions.`);
          
          if (results.length === 0) {
            return resolve([]);
          }
          
          // Check for duplicates before inserting
          console.log('Checking for duplicate transactions...');
          const transactionsToCreate: TransactionData[] = [];
          
          for (const transaction of results) {
            const isDuplicate = await checkDuplicateTransaction(transaction, userId);
            if (isDuplicate) {
              console.log(`Skipping duplicate transaction: ${transaction.description} on ${transaction.date.toISOString().split('T')[0]} for $${transaction.amount}`);
              skippedDuplicates++;
            } else {
              transactionsToCreate.push(transaction);
            }
          }
          
          if (transactionsToCreate.length === 0) {
            console.log(`All ${skippedDuplicates} transactions were duplicates. Nothing to import.`);
            return resolve([]);
          }
          
          // Batch insert transactions
          console.log(`Starting database transaction for batch insert of ${transactionsToCreate.length} transactions (skipped ${skippedDuplicates} duplicates)...`);
          const createdTransactions = await prisma.$transaction(
            transactionsToCreate.map(transaction => 
              prisma.transaction.create({
                data: {
                  amount: transaction.amount,
                  type: transaction.type,
                  category: transaction.category,
                  description: transaction.description,
                  date: transaction.date,
                  userId: transaction.userId,
                  accountId: transaction.accountId,
                }
              })
            )
          );
          
          console.log(`Successfully created ${createdTransactions.length} transactions in database.`);
          
          // Update account balance for each transaction
          console.log('Updating account balance...');
          for (const transaction of createdTransactions) {
            await updateAccountBalanceForTransaction(
              transaction.accountId,
              transaction.type,
              transaction.amount,
              true // This is an addition
            );
          }
          
          resolve(createdTransactions);
        } catch (error) {
          console.error('Error saving transactions to database:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

/**
 * Get all supported bank formats
 * @returns Array of supported bank format names
 */
export const getSupportedFormats = (): string[] => {
  return bankFormats.map(format => format.name);
}; 