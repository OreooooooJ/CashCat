import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { formatAmount, formatDescription, formatCategory } from '../src/utils/formatUtils';

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

// Define the Transaction type to match our schema
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
  source?: string;
  bankName?: string;
}

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
      .on('data', (data: CsvRow) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          console.log(`Parsed ${results.length} rows from ${filePath}`);
          
          // Process each row and create transactions
          const transactions: TransactionCreate[] = [];
          
          for (const row of results) {
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

// Main function to import CSV files
async function importCsvTransactions(): Promise<void> {
  try {
    // Get the user - use the first user in the database
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in the database');
    }
    
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
    
    // Resource directory path
    const resourceDir = path.join(__dirname, '../../resources');
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
          const imported = await importCsvFile(filePath, user.id, fileMap.account.id, fileMap.accountType);
          totalImported += imported;
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

// Run the import
importCsvTransactions()
  .then(() => {
    console.log('Import script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import script failed:', error);
    process.exit(1);
  }); 