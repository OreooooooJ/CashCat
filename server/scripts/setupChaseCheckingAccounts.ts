import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
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
  return description ? description.trim() : '';
};

const formatCategory = (category: string): string => {
  return category ? category.trim() : 'Uncategorized';
};

// Import a single CSV file
async function importCsvFile(
  filePath: string,
  userId: string,
  accountId: string,
  accountType: string = 'checking' // Default account type is checking
): Promise<number> {
  try {
    // Check if CSV file exists
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found: ${filePath}`);
      return 0;
    }

    // Read and parse CSV
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as CsvRow[];

    console.log(`Parsed ${records.length} rows from ${filePath}`);
    
    // Process each row and create transactions
    const transactions: TransactionCreate[] = [];
    
    for (const row of records) {
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
        // Create a proper date object and convert to ISO format string
        const dateObj = new Date(`${year}-${month}-${day}`);
        // Format as YYYY-MM-DD
        const formattedDate = dateObj.toISOString().split('T')[0];
        console.log(`Parsed date: ${row.Date} -> ${formattedDate}`);
        
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
          date: new Date(formattedDate),
          userId,
          accountId,
          source: 'csv',
          bankName: 'Chase Bank',
        };
        
        transactions.push(transaction);
      } catch (error) {
        console.error('Error processing row:', error);
        // Continue with next row
      }
    }
    
    // Delete existing transactions for this account before importing new ones
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
    return transactions.length;
  } catch (error) {
    console.error(`Error processing CSV file ${filePath}:`, error);
    return 0;
  }
}

// Main function
async function setupChaseAccounts(): Promise<void> {
  try {
    // Get the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      throw new Error('No test user found. Please run the createUser script first.');
    }

    console.log(`Found user: ${user.name || user.email} (${user.id})`);
    
    // Check if Chase checking accounts already exist
    let chaseAccounts = await prisma.account.findMany({
      where: { 
        userId: user.id,
        institution: 'Chase Bank',
        type: 'checking'
      }
    });
    
    // Create Chase checking accounts if they don't exist
    if (chaseAccounts.length < 2) {
      console.log('Chase checking accounts not found or less than 2, creating...');
      
      // Prepare account data
      const accountsToCreate: Array<{
        name: string;
        type: string;
        balance: number;
        institution: string;
        lastFour: string;
        color: string;
        userId: string;
      }> = [];
      
      if (chaseAccounts.length === 0) {
        // Create both accounts
        accountsToCreate.push(
          {
            name: 'Chase Checking Primary',
            type: 'checking',
            balance: 5000.00,
            institution: 'Chase Bank',
            lastFour: '5432',
            color: '#10B981', // Green
            userId: user.id
          },
          {
            name: 'Chase Checking Secondary',
            type: 'checking',
            balance: 3500.50,
            institution: 'Chase Bank',
            lastFour: '7890',
            color: '#3B82F6', // Blue
            userId: user.id
          }
        );
      } else {
        // Create just the second account
        accountsToCreate.push({
          name: 'Chase Checking Secondary',
          type: 'checking',
          balance: 3500.50,
          institution: 'Chase Bank',
          lastFour: '7890',
          color: '#3B82F6', // Blue
          userId: user.id
        });
      }
      
      // Create accounts
      if (accountsToCreate.length > 0) {
        await prisma.account.createMany({
          data: accountsToCreate
        });
        
        console.log(`Created ${accountsToCreate.length} Chase checking account(s)`);
      }
      
      // Refetch the accounts to get their IDs
      chaseAccounts = await prisma.account.findMany({
        where: { 
          userId: user.id,
          institution: 'Chase Bank',
          type: 'checking'
        }
      });
    }

    if (chaseAccounts.length !== 2) {
      console.log(`Warning: Expected 2 Chase checking accounts, but found ${chaseAccounts.length}`);
    }

    // Map accounts to their respective CSV files
    const accountCsvMap = [
      {
        account: chaseAccounts[0], // Primary account
        csvPath: path.resolve(__dirname, '../../resources/Chase_checking1.csv')
      }
    ];
    
    // Add second account if it exists
    if (chaseAccounts.length > 1) {
      accountCsvMap.push({
        account: chaseAccounts[1], // Secondary account
        csvPath: path.resolve(__dirname, '../../resources/Chase_checking2.csv')
      });
    }

    // Import transactions from CSV files
    let totalImported = 0;
    
    for (const { account, csvPath } of accountCsvMap) {
      console.log(`Importing transactions for account: ${account.name} (${account.id})`);
      const imported = await importCsvFile(csvPath, user.id, account.id, 'checking');
      totalImported += imported;
    }
    
    console.log(`Import complete. Total transactions imported: ${totalImported}`);
    
    // Update account balances based on transactions
    for (const account of chaseAccounts) {
      console.log(`Updating balance for account: ${account.name}`);
      
      // Calculate balance from transactions
      const transactions = await prisma.transaction.findMany({
        where: { accountId: account.id }
      });
      
      let balance = 0;
      for (const transaction of transactions) {
        if (transaction.type === 'income') {
          balance += transaction.amount;
        } else if (transaction.type === 'expense') {
          balance -= transaction.amount;
        }
      }
      
      // Update account balance
      await prisma.account.update({
        where: { id: account.id },
        data: { balance }
      });
      
      console.log(`Updated balance for ${account.name}: $${balance.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('Error setting up Chase checking accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupChaseAccounts()
  .then(() => console.log('Chase checking accounts setup completed'))
  .catch(e => console.error('Error in Chase checking accounts setup script:', e)); 