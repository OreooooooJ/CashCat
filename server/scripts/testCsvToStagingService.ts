import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the interface for our CSV row
interface CsvRow {
  Date: string;
  Description: string;
  'Card Member': string;
  'Account #': string;
  Amount: string;
  Category: string;
}

// Define transaction structure for parsed staging transaction
interface StagingTransaction {
  rawData: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: Date;
  bankName: string;
  source: string;
  userId: string;
  accountId: string;
}

/**
 * Format utilities - simplified versions of the application's format utils
 */
const formatAmount = (amount: number): number => {
  return parseFloat(amount.toFixed(2));
};

const formatDescription = (description: string): string => {
  return description.trim();
};

const formatCategory = (category: string): string => {
  return category.trim() || 'Uncategorized';
};

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Standardizes a staging transaction record by formatting all fields
 */
const standardizeStagingTransaction = (transaction: any): any => {
  return {
    ...transaction,
    amount: formatAmount(transaction.amount),
    description: formatDescription(transaction.description || ''),
    category: formatCategory(transaction.category || ''),
    type: transaction.type?.toLowerCase() || '',
    bankName: transaction.bankName ? toTitleCase(transaction.bankName) : undefined,
    source: transaction.source?.toLowerCase() || '',
  };
};

/**
 * Process transaction by analyzing its description and assigning a category
 * Simplified version of the application's processTransaction
 */
const processTransaction = (transaction: any, userId: string) => {
  // Define keyword-to-category mappings
  const categoryMappings = [
    { keywords: ['WALMART', 'TARGET', 'COSTCO', 'WALGREENS', 'CVS'], category: 'Retail' },
    { keywords: ['STOP & SHOP', 'KROGER', 'ALDI', 'TRADER JOE', 'WHOLE FOODS', 'SAFEWAY'], category: 'Groceries' },
    { keywords: ['AMAZON', 'EBAY', 'ETSY', 'SHOPIFY', 'ALIEXPRESS'], category: 'Online Shopping' },
    { keywords: ['UBER EATS', 'DOORDASH', 'GRUBHUB', 'MCDONALD', 'STARBUCKS', 'CHIPOTLE', 'RESTAURANT', 'PIZZA'], category: 'Dining' },
    { keywords: ['NETFLIX', 'HULU', 'DISNEY', 'SPOTIFY', 'APPLE MUSIC', 'HBO', 'PRIME VIDEO', 'YOUTUBE', 'OPENAI', 'CHATGPT'], category: 'Subscription' },
    { keywords: ['UBER', 'LYFT', 'TAXI', 'TRANSIT', 'SUBWAY', 'BUS', 'TRAIN', 'AMTRAK', 'AIRLINE', 'FLIGHT'], category: 'Transportation' },
    { keywords: ['RENT', 'MORTGAGE', 'APARTMENT', 'HOUSING', 'LEASE'], category: 'Housing' },
    { keywords: ['ELECTRIC', 'GAS', 'WATER', 'INTERNET', 'CABLE', 'PHONE', 'UTILITY'], category: 'Utilities' },
    { keywords: ['DOCTOR', 'HOSPITAL', 'PHARMACY', 'MEDICAL', 'HEALTH', 'DENTAL', 'VISION'], category: 'Healthcare' },
    { keywords: ['SCHOOL', 'TUITION', 'UNIVERSITY', 'COLLEGE', 'EDUCATION', 'COURSE', 'BOOK'], category: 'Education' },
    { keywords: ['GYM', 'FITNESS', 'SPORT', 'EXERCISE'], category: 'Fitness' },
    { keywords: ['PAYCHECK', 'SALARY', 'DEPOSIT', 'INCOME', 'PAYMENT'], category: 'Income' },
  ];
  
  // Default category when no keywords match
  const DEFAULT_CATEGORY = 'Other';
  
  // Ensure description exists and convert to uppercase for case-insensitive matching
  const description = (transaction.description || '').toUpperCase();
  
  // Find matching category based on keywords
  let category = DEFAULT_CATEGORY;
  
  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => description.includes(keyword))) {
      category = mapping.category;
      break;
    }
  }
  
  // Preserve any existing category if it was already set
  if (transaction.category) {
    category = transaction.category;
  }
  
  // Augment transaction with category and user ID
  return {
    ...transaction,
    category,
    userId,
  };
};

/**
 * Create a staging transaction from CSV data without database connection
 * Simulates the stagingTransactionService.createStagingTransaction function
 */
const createStagingTransaction = (
  rawData: string,
  parsedData: {
    amount: number;
    type: string;
    description?: string;
    date: Date;
    category?: string;
  },
  userId: string,
  accountId: string,
  source: string,
  bankName?: string
): StagingTransaction => {
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

  // Standardize the transaction data
  return standardizeStagingTransaction(formattedData);
};

/**
 * Test CSV parsing with staging transaction service
 */
async function testCsvToStagingService(filePath: string, accountType: string = 'credit'): Promise<void> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    const stagingTransactions: StagingTransaction[] = [];
    
    console.log(`Testing CSV processing with staging service for file: ${filePath}`);
    console.log(`Using account type: ${accountType}`);
    
    // Mock user and account IDs for testing
    const mockUserId = 'test-user-id';
    const mockAccountId = 'test-account-id';
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => {
        results.push(data);
      })
      .on('end', () => {
        try {
          console.log(`\nParsed ${results.length} rows from ${filePath}`);
          
          // Process each row
          for (const row of results) {
            try {
              // Skip empty rows
              if (Object.keys(row).length === 0) {
                continue;
              }
              
              // Check if Date field exists
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
              
              // Get the description
              const description = row.Description;
              
              // Create transaction object
              const transaction = {
                amount: Math.abs(amount),
                type,
                description,
                date,
                // Use category from CSV if available
                category: row.Category || undefined
              };
              
              // Create a staging transaction
              const rawData = JSON.stringify(row);
              const bankName = path.basename(filePath).includes('amex') ? 'American Express' : 'Chase';
              
              const stagingTransaction = createStagingTransaction(
                rawData,
                transaction,
                mockUserId,
                mockAccountId,
                'csv',
                bankName
              );
              
              stagingTransactions.push(stagingTransaction);
            } catch (error) {
              console.error('Error processing row:', error);
            }
          }
          
          // Display summary statistics
          const incomeCount = stagingTransactions.filter(t => t.type === 'income').length;
          const expenseCount = stagingTransactions.filter(t => t.type === 'expense').length;
          const totalIncome = stagingTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const totalExpense = stagingTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
          console.log('\n======= STAGING TRANSACTIONS SUMMARY =======');
          console.log(`Total transactions processed: ${stagingTransactions.length}`);
          console.log(`Income transactions: ${incomeCount} (Total: $${totalIncome.toFixed(2)})`);
          console.log(`Expense transactions: ${expenseCount} (Total: $${totalExpense.toFixed(2)})`);
          
          // Get categories breakdown
          const categories = [...new Set(stagingTransactions.map(t => t.category))];
          console.log('\n======= CATEGORIES BREAKDOWN =======');
          for (const category of categories) {
            const categoryTransactions = stagingTransactions.filter(t => t.category === category);
            const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            console.log(`${category}: ${categoryTransactions.length} transactions ($${categoryTotal.toFixed(2)})`);
          }
          
          // Log first 5 transactions in detail for verification
          console.log('\n======= SAMPLE STAGING TRANSACTIONS =======');
          stagingTransactions.slice(0, 5).forEach((transaction, index) => {
            console.log(`\nTransaction #${index + 1}:`);
            console.log(`Date: ${transaction.date.toLocaleDateString()}`);
            console.log(`Description: ${transaction.description}`);
            console.log(`Amount: $${transaction.amount.toFixed(2)}`);
            console.log(`Type: ${transaction.type}`);
            console.log(`Category: ${transaction.category}`);
            console.log(`Bank: ${transaction.bankName}`);
            console.log(`Source: ${transaction.source}`);
            console.log(`Raw Data: ${transaction.rawData}`);
          });
          
          console.log('\nStaging transaction processing test completed successfully!');
          resolve();
        } catch (error) {
          console.error(`Error during CSV processing test:`, error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file ${filePath}:`, error);
        reject(error);
      });
  });
}

// Main function to test CSV parsing
async function runTest(): Promise<void> {
  try {
    // Resource directory path
    const resourceDir = path.resolve(__dirname, '../../resources');
    console.log(`Looking for CSV files in: ${resourceDir}`);
    
    // Check if directory exists
    if (!fs.existsSync(resourceDir)) {
      throw new Error(`Resources directory not found: ${resourceDir}`);
    }
    
    // Test with amexMonthlyStatement.csv
    const amexFilePath = path.join(resourceDir, 'amexMonthlyStatement.csv');
    if (fs.existsSync(amexFilePath)) {
      await testCsvToStagingService(amexFilePath, 'credit');
    } else {
      console.error(`File not found: ${amexFilePath}`);
    }
  } catch (error) {
    console.error('Error testing CSV with staging service:', error);
  }
}

// Run the test function
runTest()
  .then(() => console.log('CSV to staging service test completed'))
  .catch(e => console.error('Error in CSV to staging service test:', e)); 