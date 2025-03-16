import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function calculateAccountBalances() {
  try {
    // Get all accounts
    const accounts = await prisma.account.findMany();
    console.log(`Found ${accounts.length} accounts`);
    
    for (const account of accounts) {
      // Get all transactions for this account
      const transactions = await prisma.transaction.findMany({
        where: { accountId: account.id }
      });
      
      console.log(`\nAccount: ${account.name} (${account.type})`);
      console.log(`Current stored balance: ${account.balance}`);
      console.log(`Total transactions: ${transactions.length}`);
      
      // Calculate the balance based on transactions
      let calculatedBalance = 0;
      
      for (const transaction of transactions) {
        const amount = transaction.amount;
        const type = transaction.type.toLowerCase();
        
        if (account.type.toLowerCase() === 'credit') {
          // For credit accounts:
          // - Expenses (purchases) increase the balance (positive)
          // - Income (payments) decrease the balance (negative)
          if (type === 'expense') {
            calculatedBalance += amount;
          } else if (type === 'income') {
            calculatedBalance -= amount;
          }
        } else {
          // For debit/cash accounts:
          // - Income increases the balance (positive)
          // - Expenses decrease the balance (negative)
          if (type === 'income') {
            calculatedBalance += amount;
          } else if (type === 'expense') {
            calculatedBalance -= amount;
          }
        }
      }
      
      console.log(`Calculated balance from transactions: ${calculatedBalance}`);
      console.log(`Difference: ${account.balance - calculatedBalance}`);
      
      // Ask if we should update the account balance
      if (account.balance !== calculatedBalance) {
        console.log(`\nAccount balance is incorrect. Would you like to update it?`);
        console.log(`To update this account, run the following command:`);
        console.log(`node scripts/update-account-balance.mjs ${account.id} ${calculatedBalance}`);
      }
    }
    
  } catch (error) {
    console.error('Error calculating account balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateAccountBalances(); 