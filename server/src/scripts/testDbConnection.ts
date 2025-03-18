import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Check for users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in the database`);
    if (users.length > 0) {
      console.log('Sample user:', {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name
      });
    }
    
    // Check for accounts
    const accounts = await prisma.account.findMany();
    console.log(`Found ${accounts.length} accounts in the database`);
    if (accounts.length > 0) {
      console.log('Sample account:', {
        id: accounts[0].id,
        name: accounts[0].name,
        userId: accounts[0].userId
      });
      
      // Check if the account's user exists
      const accountUser = await prisma.user.findUnique({
        where: { id: accounts[0].userId }
      });
      console.log('Account user exists:', !!accountUser);
    }
    
    // Check for transactions
    const transactions = await prisma.transaction.findMany();
    console.log(`Found ${transactions.length} transactions in the database`);
    if (transactions.length > 0) {
      console.log('Sample transaction:', {
        id: transactions[0].id,
        amount: transactions[0].amount,
        type: transactions[0].type,
        userId: transactions[0].userId
      });
      
      // Check if the transaction's user exists
      const transactionUser = await prisma.user.findUnique({
        where: { id: transactions[0].userId }
      });
      console.log('Transaction user exists:', !!transactionUser);
    }
    
    // Check for test user specifically
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    console.log('Test user exists:', !!testUser);
    if (testUser) {
      console.log('Test user ID:', testUser.id);
      
      // Check for accounts belonging to test user
      const testUserAccounts = await prisma.account.findMany({
        where: { userId: testUser.id }
      });
      console.log(`Found ${testUserAccounts.length} accounts for test user`);
      
      // Check for transactions belonging to test user
      const testUserTransactions = await prisma.transaction.findMany({
        where: { userId: testUser.id }
      });
      console.log(`Found ${testUserTransactions.length} transactions for test user`);
    }
    
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbConnection()
  .then(() => console.log('Database test completed'))
  .catch(e => console.error('Error in test script:', e)); 