import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to add credit card account...');

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

    // Check if user already has a credit card account
    const existingCreditCard = testUser.accounts.find(account => account.type === 'credit');
    
    if (existingCreditCard) {
      console.log(`User already has a credit card account: ${existingCreditCard.name}`);
      return;
    }

    // Create a credit card account
    const creditCardAccount = await prisma.account.create({
      data: {
        name: 'American Express',
        type: 'credit',
        balance: -1500.00,
        institution: 'American Express',
        lastFour: '9012',
        color: '#ef4444', // Red
        userId: testUser.id
      }
    });
    
    console.log(`Created credit card account: ${creditCardAccount.name}`);
    console.log('Successfully added credit card account!');
  } catch (error) {
    console.error('Error adding credit card account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 