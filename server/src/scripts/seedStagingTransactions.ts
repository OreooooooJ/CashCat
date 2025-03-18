import { PrismaClient } from '@prisma/client';
import { standardizeStagingTransaction } from '../utils/formatUtils.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting staging transactions seeding...');

    // Get the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      console.error('Test user not found. Please run the main seed script first.');
      return;
    }

    // Get the checking account
    const checkingAccount = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        type: 'checking'
      },
    });

    if (!checkingAccount) {
      console.error('Checking account not found. Please run the main seed script first.');
      return;
    }

    // Get the credit card account
    const creditCard = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        type: 'credit'
      },
    });

    if (!creditCard) {
      console.error('Credit card account not found. Please run the main seed script first.');
      return;
    }

    // Clear existing staging transactions
    await prisma.stagingTransaction.deleteMany({
      where: { userId: user.id },
    });

    // Sample CSV data for staging transactions
    const stagingTransactionData = [
      {
        rawData: JSON.stringify({
          'Date': '05/01/2024',
          'Description': 'AMAZON.COM*MK2QP1QY2',
          'Amount': '-29.99'
        }),
        amount: 29.99,
        type: 'expense',
        category: 'Shopping',
        description: 'AMAZON.COM*MK2QP1QY2',
        date: new Date(2024, 4, 1), // May 1, 2024
        bankName: 'Chase',
        source: 'csv',
        userId: user.id,
        accountId: creditCard.id,
      },
      {
        rawData: JSON.stringify({
          'Date': '05/02/2024',
          'Description': 'TRADER JOE\'S #123',
          'Amount': '-65.43'
        }),
        amount: 65.43,
        type: 'expense',
        category: 'Groceries',
        description: 'TRADER JOE\'S #123',
        date: new Date(2024, 4, 2), // May 2, 2024
        bankName: 'Chase',
        source: 'csv',
        userId: user.id,
        accountId: creditCard.id,
      },
      {
        rawData: JSON.stringify({
          'Date': '05/03/2024',
          'Description': 'STARBUCKS STORE #12345',
          'Amount': '-4.95'
        }),
        amount: 4.95,
        type: 'expense',
        category: 'Dining',
        description: 'STARBUCKS STORE #12345',
        date: new Date(2024, 4, 3), // May 3, 2024
        bankName: 'Chase',
        source: 'csv',
        userId: user.id,
        accountId: creditCard.id,
      },
      {
        rawData: JSON.stringify({
          'Date': '05/04/2024',
          'Description': 'PAYCHECK DEPOSIT',
          'Amount': '1250.00'
        }),
        amount: 1250.00,
        type: 'income',
        category: 'Income',
        description: 'PAYCHECK DEPOSIT',
        date: new Date(2024, 4, 4), // May 4, 2024
        bankName: 'Bank of America',
        source: 'csv',
        userId: user.id,
        accountId: checkingAccount.id,
      },
      {
        rawData: JSON.stringify({
          'Date': '05/05/2024',
          'Description': 'NETFLIX.COM',
          'Amount': '-15.99'
        }),
        amount: 15.99,
        type: 'expense',
        category: 'Subscription',
        description: 'NETFLIX.COM',
        date: new Date(2024, 4, 5), // May 5, 2024
        bankName: 'Chase',
        source: 'csv',
        userId: user.id,
        accountId: creditCard.id,
      },
    ];

    // Add staging transactions with standardized formatting
    for (const transaction of stagingTransactionData) {
      // Standardize the transaction data
      const standardizedTransaction = standardizeStagingTransaction(transaction);
      
      await prisma.stagingTransaction.create({
        data: standardizedTransaction,
      });
    }

    console.log(`Added ${stagingTransactionData.length} staging transactions`);
    console.log('Staging transactions seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding staging transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 