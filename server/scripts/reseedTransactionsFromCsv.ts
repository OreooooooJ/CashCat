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
  return category.trim() || 'Uncategorized';
};

// Import a single CSV file
async function importCsvFile(
  filePath: string,
  userId: string,
  accountId: string,
  accountType: string = 'checking' // Default account type is checking
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
              
              // Parse date
              const [month, day, year] = row.Date.split('/');
              const date = new Date(`${year}-${month}-${day}`);
              
              // Parse amount
              const amount = parseFloat(row.Amount);
              
              // Determine transaction type based on amount and account type
              let type: string;
              if (accountType === 'credit') {
                // For credit cards: positive = expense, negative = income (payment)
                type = amount > 0 ? 'expense' : 'income';
              } else {
                // For debit accounts: positive = income, negative = expense
                type = amount > 0 ? 'income' : 'expense';
              }
              
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
                bankName: path.basename(filePath).includes('amex') ? 'American Express' : 'Chase',
              };
              
              transactions.push(transaction);
            } catch (error) {
              console.error('Error processing row:', error);
              // Continue with next row
            }
          }
          
          // Bulk insert transactions
          if (transactions.length > 0) {
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

// Main function to reseed transactions from CSV files
async function reseedTransactionsFromCsv(): Promise<void> {
  try {
    // Get the user - use the first user in the database
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in the database');
    }
    
    console.log(`Using user: ${user.name || user.email} (${user.id})`);
    
    // Get the accounts
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });
    
    if (accounts.length === 0) {
      throw new Error('No accounts found for user');
    }
    
    // Find checking and credit accounts
    const checkingAccount1 = accounts.find(a => a.type.toLowerCase() === 'checking');
    const checkingAccount2 = accounts.find(a => 
      a.type.toLowerCase() === 'checking' && a.id !== checkingAccount1?.id
    );
    const creditAccount = accounts.find(a => a.type.toLowerCase() === 'credit');
    
    if (!checkingAccount1) {
      throw new Error('No checking account found for user');
    }
    
    if (!creditAccount) {
      throw new Error('No credit account found for user');
    }
    
    console.log(`Found accounts: 
      Checking 1: ${checkingAccount1.name} (${checkingAccount1.id})
      ${checkingAccount2 ? `Checking 2: ${checkingAccount2.name} (${checkingAccount2.id})` : 'No second checking account found'}
      Credit: ${creditAccount.name} (${creditAccount.id})
    `);
    
    // First, delete existing transactions for this user
    console.log('Deleting existing transactions...');
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        userId: user.id
      }
    });
    console.log(`Deleted ${deletedTransactions.count} existing transactions`);
    
    // Map file patterns to account types and IDs
    const fileAccountMap = [
      {
        pattern: 'Chase_checking1.csv',
        accountType: 'checking',
        account: checkingAccount1
      },
      {
        pattern: 'Chase_checking2.csv',
        accountType: 'checking',
        account: checkingAccount2 || checkingAccount1 // Fallback to first checking account
      },
      {
        pattern: 'amexMonthlyStatement.csv',
        accountType: 'credit',
        account: creditAccount
      }
    ];
    
    // Resource directory path - using path.resolve
    const resourceDir = path.resolve(__dirname, '../../resources');
    console.log(`Looking for CSV files in: ${resourceDir}`);
    
    // Check if directory exists
    if (!fs.existsSync(resourceDir)) {
      throw new Error(`Resources directory not found: ${resourceDir}`);
    }
    
    const files = fs.readdirSync(resourceDir);
    
    // Import each file
    let totalImported = 0;
    
    for (const file of files) {
      if (file.endsWith('.csv')) {
        // Find the matching account for this file
        const fileMap = fileAccountMap.find(map => file.includes(map.pattern));
        
        if (fileMap && fileMap.account) {
          console.log(`Importing ${file} for account ${fileMap.account.name} (${fileMap.accountType})`);
          const filePath = path.join(resourceDir, file);
          try {
            const imported = await importCsvFile(filePath, user.id, fileMap.account.id, fileMap.accountType);
            totalImported += imported;
          } catch (error) {
            console.error(`Error importing file ${file}:`, error);
            // Continue with next file
          }
        } else {
          console.log(`Skipping ${file} - no matching account found`);
        }
      }
    }
    
    console.log(`Import complete. Total transactions imported: ${totalImported}`);
  } catch (error) {
    console.error('Error importing CSV transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reseed function
reseedTransactionsFromCsv()
  .then(() => console.log('Transaction reseeding completed'))
  .catch(e => console.error('Error in transaction reseeding:', e)); 