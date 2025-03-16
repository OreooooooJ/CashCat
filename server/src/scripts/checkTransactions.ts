import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('No test user found.');
      return;
    }

    console.log(`Found user: ${user.name}`);
    
    // Get accounts
    const accounts = await prisma.account.findMany({
      where: { userId: user.id }
    });
    
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach(account => {
      console.log(`- ${account.name} (${account.type}): $${account.balance}`);
    });
    
    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { account: true },
      orderBy: { date: 'desc' }
    });
    
    console.log(`\nFound ${transactions.length} transactions:`);
    transactions.slice(0, 10).forEach(transaction => {
      const accountName = transaction.account ? transaction.account.name : 'No Account';
      const amount = transaction.type === 'INCOME' 
        ? `+$${transaction.amount}` 
        : `-$${transaction.amount}`;
      
      console.log(`- ${new Date(transaction.date).toLocaleDateString()}: ${transaction.description} (${transaction.category}) - ${amount} - Account: ${accountName}`);
    });
    
    if (transactions.length > 10) {
      console.log(`... and ${transactions.length - 10} more transactions`);
    }
    
    console.log('\nDatabase check completed.');
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 