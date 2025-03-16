import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateAccountBalance() {
  try {
    // Get command line arguments
    const accountId = process.argv[2];
    const newBalance = parseFloat(process.argv[3]);
    
    if (!accountId || isNaN(newBalance)) {
      console.error('Usage: node update-account-balance.mjs <accountId> <newBalance>');
      process.exit(1);
    }
    
    // Find the account
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      console.error(`Account with ID ${accountId} not found`);
      process.exit(1);
    }
    
    console.log(`Account: ${account.name} (${account.type})`);
    console.log(`Current balance: ${account.balance}`);
    console.log(`New balance: ${newBalance}`);
    console.log(`Difference: ${newBalance - account.balance}`);
    
    // Update the account balance
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance }
    });
    
    console.log(`\nAccount balance updated successfully!`);
    console.log(`Updated account: ${updatedAccount.name}`);
    console.log(`New balance: ${updatedAccount.balance}`);
    
  } catch (error) {
    console.error('Error updating account balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAccountBalance(); 