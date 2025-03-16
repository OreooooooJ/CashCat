import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { accounts: true }
    });

    if (!user) {
      console.log('No test user found. Please run the createUser script first.');
      return;
    }

    console.log(`Found user: ${user.name}`);
    
    // Get user's accounts
    if (user.accounts.length === 0) {
      console.log('No accounts found for this user. Please run the updateAccounts script first.');
      return;
    }
    
    console.log(`Found ${user.accounts.length} accounts`);
    
    // Delete existing transactions for this user
    const deletedCount = await prisma.transaction.deleteMany({
      where: { userId: user.id }
    });
    
    console.log(`Deleted ${deletedCount.count} existing transactions`);
    
    // Create sample transactions
    const transactions = [
      // Current month income
      {
        amount: 3500,
        type: 'INCOME',
        category: 'Income',
        description: 'Monthly Salary',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      {
        amount: 300,
        type: 'INCOME',
        category: 'Income',
        description: 'Freelance work',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      
      // Current month expenses
      {
        amount: 92.17,
        type: 'EXPENSE',
        category: 'Food & Dining',
        description: 'Grocery shopping',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      },
      {
        amount: 45.99,
        type: 'EXPENSE',
        category: 'Entertainment',
        description: 'Netflix subscription',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      },
      {
        amount: 130,
        type: 'EXPENSE',
        category: 'Bills & Utilities',
        description: 'Electricity bill',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      {
        amount: 35.75,
        type: 'EXPENSE',
        category: 'Transportation',
        description: 'Gas',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      },
      
      // Previous month income
      {
        amount: 3500,
        type: 'INCOME',
        category: 'Income',
        description: 'Monthly Salary',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      {
        amount: 250,
        type: 'INCOME',
        category: 'Income',
        description: 'Freelance work',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 25),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      
      // Previous month expenses
      {
        amount: 85.43,
        type: 'EXPENSE',
        category: 'Food & Dining',
        description: 'Grocery shopping',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      },
      {
        amount: 45.99,
        type: 'EXPENSE',
        category: 'Entertainment',
        description: 'Netflix subscription',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 10),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      },
      {
        amount: 125,
        type: 'EXPENSE',
        category: 'Bills & Utilities',
        description: 'Electricity bill',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'debit')?.id || user.accounts[0].id
      },
      {
        amount: 32.5,
        type: 'EXPENSE',
        category: 'Transportation',
        description: 'Gas',
        date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 20),
        userId: user.id,
        accountId: user.accounts.find(a => a.type === 'credit')?.id || user.accounts[0].id
      }
    ];
    
    // Create transactions
    const createdTransactions = await prisma.transaction.createMany({
      data: transactions
    });
    
    console.log(`Created ${createdTransactions.count} sample transactions`);
    console.log('Sample transactions have been linked to accounts');
    
  } catch (error) {
    console.error('Error updating transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 