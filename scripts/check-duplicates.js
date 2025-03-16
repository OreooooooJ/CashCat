const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicateTransactions() {
  try {
    // Get all transactions
    const allTransactions = await prisma.transaction.findMany();
    console.log(`Total transactions in database: ${allTransactions.length}`);
    
    // Create a map to track potential duplicates
    const transactionMap = new Map();
    const duplicates = [];
    
    // Check for duplicates based on date, description, and amount
    allTransactions.forEach(transaction => {
      // Create a unique key for each transaction
      const dateStr = transaction.date.toISOString().split('T')[0]; // Just the date part
      const key = `${dateStr}|${transaction.description}|${transaction.amount}|${transaction.accountId}`;
      
      if (transactionMap.has(key)) {
        // This is a duplicate
        const existingTransaction = transactionMap.get(key);
        duplicates.push({
          original: existingTransaction,
          duplicate: transaction,
          key
        });
      } else {
        // First time seeing this transaction
        transactionMap.set(key, transaction);
      }
    });
    
    // Print results
    console.log(`Found ${duplicates.length} duplicate transactions`);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate Transactions:');
      duplicates.forEach((dup, index) => {
        console.log(`\nDuplicate #${index + 1}:`);
        console.log(`Original: ID=${dup.original.id}, Date=${dup.original.date.toISOString().split('T')[0]}, Description="${dup.original.description}", Amount=${dup.original.amount}, Type=${dup.original.type}`);
        console.log(`Duplicate: ID=${dup.duplicate.id}, Date=${dup.duplicate.date.toISOString().split('T')[0]}, Description="${dup.duplicate.description}", Amount=${dup.duplicate.amount}, Type=${dup.duplicate.type}`);
      });
      
      // Group duplicates by account
      const accountDuplicates = new Map();
      duplicates.forEach(dup => {
        const accountId = dup.original.accountId || 'null';
        if (!accountDuplicates.has(accountId)) {
          accountDuplicates.set(accountId, []);
        }
        accountDuplicates.get(accountId).push(dup);
      });
      
      console.log('\nDuplicates by Account:');
      for (const [accountId, dups] of accountDuplicates.entries()) {
        console.log(`\nAccount ID: ${accountId}`);
        console.log(`Number of duplicates: ${dups.length}`);
      }
    }
    
  } catch (error) {
    console.error('Error finding duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateTransactions(); 