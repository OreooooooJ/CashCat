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

// Define transaction structure for parsing
interface ParsedTransaction {
  date: Date;
  description: string;
  vendor: string;
  accountNumber: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  bankName: string;
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

// Test CSV parsing function
async function testCsvParsing(filePath: string, accountType: string = 'credit'): Promise<void> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    const parsedTransactions: ParsedTransaction[] = [];
    
    console.log(`Testing CSV parsing for file: ${filePath}`);
    console.log(`Using account type: ${accountType}`);
    
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
              let type: 'income' | 'expense';
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
              
              // Create parsed transaction object
              const transaction: ParsedTransaction = {
                date,
                description,
                vendor,
                accountNumber,
                amount: Math.abs(formatAmount(amount)),
                category,
                type,
                bankName: path.basename(filePath).includes('amex') ? 'American Express' : 'Chase',
              };
              
              parsedTransactions.push(transaction);
            } catch (error) {
              console.error('Error processing row:', error);
            }
          }
          
          // Display summary statistics
          const incomeCount = parsedTransactions.filter(t => t.type === 'income').length;
          const expenseCount = parsedTransactions.filter(t => t.type === 'expense').length;
          const totalIncome = parsedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const totalExpense = parsedTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
          console.log('\n======= PARSING SUMMARY =======');
          console.log(`Total transactions parsed: ${parsedTransactions.length}`);
          console.log(`Income transactions: ${incomeCount} (Total: $${totalIncome.toFixed(2)})`);
          console.log(`Expense transactions: ${expenseCount} (Total: $${totalExpense.toFixed(2)})`);
          
          // Get categories breakdown
          const categories = [...new Set(parsedTransactions.map(t => t.category))];
          console.log('\n======= CATEGORIES BREAKDOWN =======');
          for (const category of categories) {
            const categoryTransactions = parsedTransactions.filter(t => t.category === category);
            const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            console.log(`${category}: ${categoryTransactions.length} transactions ($${categoryTotal.toFixed(2)})`);
          }
          
          // Log first 5 transactions in detail for verification
          console.log('\n======= SAMPLE TRANSACTIONS =======');
          parsedTransactions.slice(0, 5).forEach((transaction, index) => {
            console.log(`\nTransaction #${index + 1}:`);
            console.log(`Date: ${transaction.date.toLocaleDateString()}`);
            console.log(`Description: ${transaction.description}`);
            console.log(`Amount: $${transaction.amount.toFixed(2)}`);
            console.log(`Type: ${transaction.type}`);
            console.log(`Category: ${transaction.category}`);
            console.log(`Bank: ${transaction.bankName}`);
          });
          
          console.log('\nCSV parsing test completed successfully!');
          resolve();
        } catch (error) {
          console.error(`Error during CSV parsing test:`, error);
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
      await testCsvParsing(amexFilePath, 'credit');
    } else {
      console.error(`File not found: ${amexFilePath}`);
    }
  } catch (error) {
    console.error('Error testing CSV parsing:', error);
  }
}

// Run the test function
runTest()
  .then(() => console.log('CSV parsing test completed'))
  .catch(e => console.error('Error in CSV parsing test:', e)); 