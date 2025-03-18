import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

// Categories for expenses
const expenseCategories = [
  'Groceries',
  'Dining',
  'Entertainment',
  'Shopping',
  'Transportation',
  'Utilities',
  'Housing',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts',
  'Subscriptions',
  'Online Shopping',
  'Home Improvement',
  'Telecommunications',
  'Insurance',
  'Pet Supplies',
  'Financial Transaction',
  'Retail',
  'Miscellaneous'
];

// Categories for income
const incomeCategories = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Refunds',
  'Income',
  'Transfer'
];

// Recurring vendor names
const recurringVendors = {
  Groceries: ['WHOLE FOODS', 'TRADER JOE\'S', 'STOP & SHOP', 'INSTACART', 'GROCERY STORE'],
  Dining: ['STARBUCKS', 'UBER EATS', 'DOORDASH', 'KFC', 'SICHUAN GOURMET'],
  Subscriptions: ['NETFLIX', 'SPOTIFY', 'APPLE', 'DISNEY+', 'AMAZON PRIME', 'GOOGLE', 'OPENAI', 'PLANET FITNESS'],
  'Online Shopping': ['AMAZON.COM', 'APPLE.COM', 'WALMART.COM', 'BEST BUY'],
  Utilities: ['UTILITY BILL PAYMENT - GAS', 'UTILITY BILL PAYMENT - ELECTRIC', 'UTILITY BILL PAYMENT - WATER'],
  Housing: ['HOME MORTGAGE PAYMENT', 'RENT PAYMENT'],
  Insurance: ['CAR INSURANCE', 'HOME INSURANCE', 'HEALTH INSURANCE'],
  Income: ['DIRECT DEPOSIT - EMPLOYER', 'RENT INCOME DEPOSIT', 'FREELANCE PAYMENT', 'DIVIDEND PAYMENT'],
  Transfer: ['INTER-ACCOUNT TRANSFER']
};

interface Transaction {
  amount: number;
  type: string;
  category: string;
  description: string;
  date: Date;
  userId: string;
  source?: string;
  originalDescription?: string;
  vendor?: string;
  accountNumber?: string;
  bankName?: string;
  account?: string;
}

// Account IDs used in the mock data
const accounts = [
  { number: '-71002', name: 'Credit Card', type: 'credit', bank: 'American Express' },
  { number: '-12345', name: 'Checking 1', type: 'checking', bank: 'Chase' },
  { number: '-67890', name: 'Checking 2', type: 'checking', bank: 'Chase' }
];

// Helper functions
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate a transaction for March 2025
function generateMarchTransaction(userId: string): Transaction {
  // Generate a random date in March 2025 (0-indexed month)
  const year = 2025;
  const month = 2; // March (0-indexed)
  const day = getRandomInt(1, 17); // First half of March
  const date = new Date(year, month, day);
  
  // Determine transaction type (70% expense, 30% income)
  const transactionType = Math.random() < 0.7 ? 'expense' : 'income';
  const categories = transactionType === 'expense' ? expenseCategories : incomeCategories;
  const category = getRandomElement(categories);
  
  // Generate amount based on category and type
  let amount: number;
  if (transactionType === 'expense') {
    // Expenses are negative
    if (category === 'Housing' || category === 'Travel') {
      // Higher amount categories
      amount = -getRandomInt(800, 2500);
    } else if (category === 'Groceries' || category === 'Shopping' || category === 'Utilities') {
      // Medium amount categories
      amount = -getRandomInt(50, 250);
    } else {
      // Lower amount categories
      amount = -getRandomInt(5, 150);
    }
  } else {
    // Income is positive
    if (category === 'Salary' || category === 'Income') {
      amount = getRandomInt(2000, 10000);
    } else if (category === 'Freelance') {
      amount = getRandomInt(500, 2500);
    } else {
      amount = getRandomInt(50, 500);
    }
  }
  
  // Get account based on transaction type
  const accountIndex = transactionType === 'expense' && Math.random() < 0.6 ? 0 : getRandomInt(1, 2);
  const account = accounts[accountIndex];
  
  // Generate description based on category
  let description: string;
  let vendor: string;
  
  if (recurringVendors[category as keyof typeof recurringVendors]) {
    const vendors = recurringVendors[category as keyof typeof recurringVendors];
    vendor = getRandomElement(vendors);
    if (vendor.includes(' - ')) {
      description = vendor;
    } else {
      description = `${vendor} ${transactionType === 'expense' ? 'PURCHASE' : 'PAYMENT'}`;
    }
  } else {
    vendor = category.toUpperCase();
    description = `${category.toUpperCase()} ${transactionType === 'expense' ? 'PAYMENT' : 'INCOME'}`;
  }
  
  return {
    amount,
    type: transactionType,
    category,
    description,
    date,
    userId,
    source: 'generated',
    originalDescription: description,
    vendor: vendor.split(' ')[0],
    accountNumber: account.number,
    bankName: account.bank
  };
}

// Main function to seed March 2025 transactions
async function seedMarchTransactions() {
  try {
    // Find the first user in the system
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('No user found in the system. Please create a user first.');
      process.exit(1);
    }
    
    const userId = user.id;
    console.log(`Using user ID: ${userId} for transactions`);
    
    // Generate 100 transactions for March 2025
    const count = 100;
    const transactions = Array.from({ length: count }, () => generateMarchTransaction(userId));
    
    console.log(`Generated ${transactions.length} transactions for March 2025`);
    
    // Save to database
    const result = await prisma.transaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });
    
    console.log(`Successfully added ${result.count} new transactions to the database`);
    
  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMarchTransactions()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 