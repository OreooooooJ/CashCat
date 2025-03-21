import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Define the interface for our CSV row
interface CsvRow {
  Date: string;
  Description: string;
  'Card Member': string;
  'Account #': string;
  Amount: string;
  Category: string;
}

// Define transaction create interface
interface TransactionCreate {
  amount: number;
  type: string;
  category: string;
  description: string;
  originalDescription?: string;
  vendor?: string;
  accountNumber?: string;
  date: Date;
  userId: string;
  accountId: string;
  source: string;
  bankName?: string;
}

// Format helpers
const formatAmount = (amount: number): number => {
  return parseFloat(amount.toFixed(2));
};

const formatDescription = (description: string): string => {
  return description.trim();
};

const formatCategory = (category: string): string => {
  return category?.trim() || 'Uncategorized';
};

// Import a single CSV file
async function importCsvFile(
  filePath: string,
  userId: string,
  accountId: string,
  accountType: string = 'credit' // Default account type is credit for Amex
): Promise<number> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          console.log(`Parsed ${results.length} rows from ${filePath}`);
          
          // Process each row and create transactions
          const transactions: TransactionCreate[] = [];
          
          for (const row of results) {
            try {
              // Skip empty rows
              if (Object.keys(row).length === 0) {
                continue;
              }
              
              // Parse date
              if (!row.Date) {
                console.warn('Date field is missing in row, skipping');
                continue;
              }
              
              // Parse date (MM/DD/YYYY)
              const [month, day, year] = row.Date.split('/');
              const date = new Date(`${year}-${month}-${day}`);
              
              // Parse amount
              const amount = parseFloat(row.Amount);
              
              // Determine transaction type based on amount and account type
              // For credit cards: positive = expense, negative = income (payment)
              const type = amount > 0 ? 'expense' : 'income';
              
              // Get the description and vendor
              const description = formatDescription(row.Description);
              const vendor = formatDescription(row['Card Member']);
              const accountNumber = row['Account #'];
              const category = formatCategory(row.Category || (type === 'income' ? 'Income' : 'Uncategorized'));
              
              // Create transaction
              const transaction = {
                amount: Math.abs(formatAmount(amount)),
                type,
                category,
                description,
                originalDescription: row.Description,
                vendor,
                accountNumber,
                date,
                userId,
                accountId,
                source: 'csv',
                bankName: 'American Express',
              };
              
              transactions.push(transaction);
            } catch (error) {
              console.error('Error processing row:', error);
              // Continue with next row
            }
          }
          
          // Delete existing transactions for this account
          if (transactions.length > 0) {
            console.log(`Deleting existing transactions for account ${accountId}...`);
            const deletedCount = await prisma.transaction.deleteMany({
              where: {
                accountId,
                userId
              }
            });
            console.log(`Deleted ${deletedCount.count} existing transactions`);
            
            // Bulk insert transactions
            await prisma.transaction.createMany({
              data: transactions,
              skipDuplicates: true,
            });
          }
          
          console.log(`Successfully imported ${transactions.length} transactions from ${filePath}`);
          resolve(transactions.length);
        } catch (error) {
          console.error(`Error processing CSV file ${filePath}:`, error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file ${filePath}:`, error);
        reject(error);
      });
  });
}

// Main function to import Amex transactions
async function importAmexTransactions(): Promise<void> {
  try {
    // Get the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      throw new Error('No test user found in the database');
    }
    
    console.log(`Using user: ${user.name || user.email} (${user.id})`);
    
    // Find the American Express account
    const amexAccount = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        institution: 'American Express',
        type: 'credit'
      },
    });
    
    if (!amexAccount) {
      throw new Error('No American Express account found for user');
    }
    
    console.log(`Found American Express account: ${amexAccount.name} (${amexAccount.id})`);
    
    // Resource directory path - using path.resolve
    const resourceDir = path.resolve(__dirname, '../../resources');
    console.log(`Looking for amexMonthlyStatement.csv in: ${resourceDir}`);
    
    // Check if directory exists
    if (!fs.existsSync(resourceDir)) {
      throw new Error(`Resources directory not found: ${resourceDir}`);
    }
    
    // Check if Amex CSV file exists
    const amexFilePath = path.join(resourceDir, 'amexMonthlyStatement.csv');
    if (!fs.existsSync(amexFilePath)) {
      throw new Error(`Amex CSV file not found: ${amexFilePath}`);
    }
    
    console.log(`Importing ${amexFilePath} for American Express account...`);
    
    // Import the Amex CSV file
    const imported = await importCsvFile(amexFilePath, user.id, amexAccount.id, 'credit');
    
    console.log(`Import complete. Total transactions imported: ${imported}`);
    
    // Update account balance based on transactions
    console.log('Updating account balance...');
    
    // Calculate balance from transactions
    const transactions = await prisma.transaction.findMany({
      where: { accountId: amexAccount.id }
    });
    
    let balance = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        balance -= transaction.amount;
      } else if (transaction.type === 'income') {
        balance += transaction.amount;
      }
    });
    
    // For credit accounts, negative balance means you owe money
    balance = -Math.abs(balance);
    
    // Update account balance
    await prisma.account.update({
      where: { id: amexAccount.id },
      data: { balance }
    });
    
    console.log(`Updated account balance to $${balance.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error importing Amex transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importAmexTransactions()
  .then(() => console.log('American Express transaction import completed'))
  .catch(e => console.error('Error importing American Express transactions:', e)); 