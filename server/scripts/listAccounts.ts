import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAccounts() {
  try {
    console.log('Listing all user accounts...');
    
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { accounts: true }
    });

    if (!user) {
      console.log('No test user found in the database');
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}`);
    
    if (user.accounts.length === 0) {
      console.log('No accounts found for this user');
      return;
    }
    
    console.log(`\nAccounts (${user.accounts.length}):`);
    user.accounts.forEach(account => {
      console.log(`- ${account.name} (${account.type})`);
      console.log(`  ID: ${account.id}`);
      console.log(`  Institution: ${account.institution}`);
      console.log(`  Last Four: ${account.lastFour}`);
      console.log(`  Balance: $${account.balance.toFixed(2)}`);
      console.log(`  Color: ${account.color}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
listAccounts()
  .then(() => console.log('Account listing completed'))
  .catch(e => console.error('Error listing accounts:', e)); 