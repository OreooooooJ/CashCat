import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to add test accounts...');

    // Find the test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: { accounts: true }
    });

    if (!testUser) {
      console.error('Test user not found. Please run seedData.ts first.');
      return;
    }

    console.log(`Found test user: ${testUser.name} (${testUser.email})`);
    console.log(`Current accounts: ${testUser.accounts.length}`);

    // Only add accounts if the user doesn't have any
    if (testUser.accounts.length === 0) {
      // Create a checking account
      const checkingAccount = await prisma.account.create({
        data: {
          name: 'Checking Account',
          type: 'debit',
          balance: 5000.00,
          institution: 'Bank of America',
          lastFour: '1234',
          color: '#10b981', // Green
          userId: testUser.id
        }
      });
      console.log(`Created checking account: ${checkingAccount.name}`);

      // Create a savings account
      const savingsAccount = await prisma.account.create({
        data: {
          name: 'Savings Account',
          type: 'debit',
          balance: 10000.00,
          institution: 'Bank of America',
          lastFour: '5678',
          color: '#3b82f6', // Blue
          userId: testUser.id
        }
      });
      console.log(`Created savings account: ${savingsAccount.name}`);

      // Create a credit card account
      const creditCardAccount = await prisma.account.create({
        data: {
          name: 'Credit Card',
          type: 'credit',
          balance: -1500.00,
          institution: 'American Express',
          lastFour: '9012',
          color: '#ef4444', // Red
          userId: testUser.id
        }
      });
      console.log(`Created credit card account: ${creditCardAccount.name}`);

      console.log('Successfully added test accounts!');
    } else {
      console.log('User already has accounts. Skipping account creation.');
    }
  } catch (error) {
    console.error('Error adding test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 