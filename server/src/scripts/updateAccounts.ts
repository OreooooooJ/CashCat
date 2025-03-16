import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting account update...');

  try {
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('No test user found. Please run the createUser script first.');
      return;
    }

    console.log(`Found user: ${user.name}`);
    
    // Delete existing accounts for this user
    const deletedCount = await prisma.account.deleteMany({
      where: { userId: user.id }
    });
    
    console.log(`Deleted ${deletedCount.count} existing accounts`);
    
    // Create sample accounts
    const accounts = [
      {
        name: 'Checking Account',
        type: 'debit',
        balance: 2500.75,
        institution: 'Bank of America',
        lastFour: '4321',
        color: '#3B82F6', // Blue
        userId: user.id
      },
      {
        name: 'Savings Account',
        type: 'debit',
        balance: 15000.50,
        institution: 'Chase Bank',
        lastFour: '8765',
        color: '#10B981', // Green
        userId: user.id
      },
      {
        name: 'Credit Card',
        type: 'credit',
        balance: -1250.30,
        institution: 'American Express',
        lastFour: '3456',
        color: '#EF4444', // Red
        userId: user.id
      },
      {
        name: 'Investment Account',
        type: 'investment',
        balance: 45000.00,
        institution: 'Fidelity',
        lastFour: '9012',
        color: '#8B5CF6', // Purple
        userId: user.id
      }
    ];
    
    // Create accounts
    const createdAccounts = await prisma.account.createMany({
      data: accounts
    });
    
    console.log(`Created ${createdAccounts.count} sample accounts`);
    
  } catch (error) {
    console.error('Error updating accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Account update completed'))
  .catch(e => console.error('Error in account update script:', e)); 