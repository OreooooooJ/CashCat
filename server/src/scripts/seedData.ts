import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: hashedPassword
      },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });

    console.log(`Created user: ${user.name} (${user.email})`);

    // Create accounts
    const accountData = [
      {
        name: 'Checking Account',
        type: 'checking',
        balance: 5000,
        institution: 'Bank of America',
        lastFour: '1234',
        color: '#10B981', // Green
        userId: user.id,
      },
      {
        name: 'Savings Account',
        type: 'savings',
        balance: 10000,
        institution: 'Bank of America',
        lastFour: '5678',
        color: '#3B82F6', // Blue
        userId: user.id,
      },
      {
        name: 'Credit Card',
        type: 'credit',
        balance: -1500,
        institution: 'Chase',
        lastFour: '9012',
        color: '#EF4444', // Red
        userId: user.id,
      },
    ];

    // Clear existing accounts
    await prisma.account.deleteMany({
      where: { userId: user.id },
    });

    // Add new accounts
    const createdAccounts = [];
    for (const account of accountData) {
      const createdAccount = await prisma.account.create({
        data: account,
      });
      createdAccounts.push(createdAccount);
    }

    console.log(`Added ${accountData.length} accounts`);

    // Create transactions
    const transactionData = [
      {
        amount: 3500,
        type: 'INCOME',
        category: 'Income',
        description: 'Monthly Salary',
        date: new Date(2024, 2, 1), // March 1, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -85.43,
        type: 'EXPENSE',
        category: 'Food & Dining',
        description: 'Grocery shopping',
        date: new Date(2024, 2, 5), // March 5, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -45.99,
        type: 'EXPENSE',
        category: 'Entertainment',
        description: 'Netflix subscription',
        date: new Date(2024, 2, 10), // March 10, 2024
        userId: user.id,
        accountId: createdAccounts[2].id, // Credit card
      },
      {
        amount: -125.00,
        type: 'EXPENSE',
        category: 'Bills & Utilities',
        description: 'Electricity bill',
        date: new Date(2024, 2, 15), // March 15, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -32.50,
        type: 'EXPENSE',
        category: 'Transportation',
        description: 'Gas',
        date: new Date(2024, 2, 20), // March 20, 2024
        userId: user.id,
        accountId: createdAccounts[2].id, // Credit card
      },
      {
        amount: 250.00,
        type: 'INCOME',
        category: 'Income',
        description: 'Freelance work',
        date: new Date(2024, 2, 25), // March 25, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      // April transactions
      {
        amount: 3500,
        type: 'INCOME',
        category: 'Income',
        description: 'Monthly Salary',
        date: new Date(2024, 3, 1), // April 1, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -92.17,
        type: 'EXPENSE',
        category: 'Food & Dining',
        description: 'Grocery shopping',
        date: new Date(2024, 3, 5), // April 5, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -45.99,
        type: 'EXPENSE',
        category: 'Entertainment',
        description: 'Netflix subscription',
        date: new Date(2024, 3, 10), // April 10, 2024
        userId: user.id,
        accountId: createdAccounts[2].id, // Credit card
      },
      {
        amount: -130.00,
        type: 'EXPENSE',
        category: 'Bills & Utilities',
        description: 'Electricity bill',
        date: new Date(2024, 3, 15), // April 15, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
      {
        amount: -35.75,
        type: 'EXPENSE',
        category: 'Transportation',
        description: 'Gas',
        date: new Date(2024, 3, 20), // April 20, 2024
        userId: user.id,
        accountId: createdAccounts[2].id, // Credit card
      },
      {
        amount: 300.00,
        type: 'INCOME',
        category: 'Income',
        description: 'Freelance work',
        date: new Date(2024, 3, 25), // April 25, 2024
        userId: user.id,
        accountId: createdAccounts[0].id, // Checking account
      },
    ];

    // Clear existing transactions
    await prisma.transaction.deleteMany({
      where: { userId: user.id },
    });

    // Add new transactions
    for (const transaction of transactionData) {
      await prisma.transaction.create({
        data: transaction,
      });
    }

    console.log(`Added ${transactionData.length} transactions`);

    // Create budgets
    const budgetData = [
      {
        category: 'Food & Dining',
        amount: 500,
        period: 'monthly',
        userId: user.id,
      },
      {
        category: 'Entertainment',
        amount: 200,
        period: 'monthly',
        userId: user.id,
      },
      {
        category: 'Bills & Utilities',
        amount: 300,
        period: 'monthly',
        userId: user.id,
      },
      {
        category: 'Transportation',
        amount: 150,
        period: 'monthly',
        userId: user.id,
      },
    ];

    // Clear existing budgets
    await prisma.budget.deleteMany({
      where: { userId: user.id },
    });

    // Add new budgets
    for (const budget of budgetData) {
      await prisma.budget.create({
        data: budget,
      });
    }

    console.log(`Added ${budgetData.length} budgets`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 