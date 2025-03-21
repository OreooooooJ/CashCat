import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAmexAccount() {
  try {
    console.log('Creating American Express credit card account...');

    // Find the test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { accounts: true }
    });

    if (!testUser) {
      console.error('Test user not found. Please run seedData.ts first.');
      return;
    }

    console.log(`Found test user: ${testUser.name} (${testUser.email})`);
    
    // Check if user already has an Amex account
    const existingAmex = testUser.accounts.find(account => 
      account.institution === 'American Express' && account.type === 'credit'
    );
    
    if (existingAmex) {
      console.log(`User already has an American Express credit card: ${existingAmex.name} (ID: ${existingAmex.id})`);
      return;
    }

    // Create a new American Express credit card account
    const amexAccount = await prisma.account.create({
      data: {
        name: 'American Express Card',
        type: 'credit',
        balance: -1200.00,
        institution: 'American Express',
        lastFour: '7102',
        color: '#8B5CF6', // Purple
        userId: testUser.id
      }
    });
    
    console.log(`Created American Express credit card account:`);
    console.log(`- Name: ${amexAccount.name}`);
    console.log(`- ID: ${amexAccount.id}`);
    console.log(`- Type: ${amexAccount.type}`);
    console.log(`- Institution: ${amexAccount.institution}`);
    console.log(`- Last Four: ${amexAccount.lastFour}`);
    console.log(`- Balance: $${amexAccount.balance.toFixed(2)}`);
    console.log(`- Color: ${amexAccount.color}`);
    
    console.log('Successfully added American Express credit card account!');
  } catch (error) {
    console.error('Error creating American Express account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAmexAccount()
  .then(() => console.log('American Express account creation completed'))
  .catch(e => console.error('Error creating American Express account:', e)); 