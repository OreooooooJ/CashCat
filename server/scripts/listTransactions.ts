import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTransactions() {
  try {
    console.log('Listing transactions for American Express account...');
    
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('No test user found in the database');
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Find the American Express account
    const amexAccount = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        institution: 'American Express',
        type: 'credit'
      }
    });
    
    if (!amexAccount) {
      console.log('No American Express account found for user');
      return;
    }
    
    console.log(`Found American Express account: ${amexAccount.name} (${amexAccount.id})`);
    console.log(`Current balance: $${amexAccount.balance.toFixed(2)}\n`);
    
    // Get transactions for the American Express account
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        accountId: amexAccount.id
      },
      orderBy: { date: 'desc' }
    });
    
    if (transactions.length === 0) {
      console.log('No transactions found for this account');
      return;
    }
    
    // Display transaction statistics
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    console.log(`Total transactions: ${transactions.length}`);
    console.log(`Income transactions: ${incomeCount} (Total: $${totalIncome.toFixed(2)})`);
    console.log(`Expense transactions: ${expenseCount} (Total: $${totalExpense.toFixed(2)})`);
    
    // Get categories breakdown
    const categories = [...new Set(transactions.map(t => t.category))];
    console.log('\nCategories breakdown:');
    for (const category of categories) {
      const categoryTransactions = transactions.filter(t => t.category === category);
      const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      console.log(`- ${category}: ${categoryTransactions.length} transactions ($${categoryTotal.toFixed(2)})`);
    }
    
    // List the top 10 transactions
    console.log('\nTop 10 transactions:');
    transactions.slice(0, 10).forEach((transaction, index) => {
      console.log(`${index + 1}. [${transaction.date.toISOString().split('T')[0]}] ${transaction.description}`);
      console.log(`   $${transaction.amount.toFixed(2)} (${transaction.type}) - ${transaction.category}`);
    });
  } catch (error) {
    console.error('Error listing transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
listTransactions()
  .then(() => console.log('\nTransaction listing completed'))
  .catch(e => console.error('Error listing transactions:', e)); 