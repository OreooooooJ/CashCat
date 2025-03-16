import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function removeDuplicateTransactions() {
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
      console.log('\nDuplicate Transactions to be removed:');
      
      // Collect IDs of duplicates to delete
      const idsToDelete = duplicates.map(dup => {
        console.log(`Duplicate: ID=${dup.duplicate.id}, Date=${dup.duplicate.date.toISOString().split('T')[0]}, Description="${dup.duplicate.description}", Amount=${dup.duplicate.amount}, Type=${dup.duplicate.type}`);
        return dup.duplicate.id;
      });
      
      // Ask for confirmation before deleting
      console.log(`\nAbout to delete ${idsToDelete.length} duplicate transactions.`);
      console.log('To proceed, run the following command:');
      console.log('node scripts/confirm-delete-duplicates.mjs');
      
      // Write IDs to a temporary file for the confirmation script
      const fs = await import('fs/promises');
      await fs.writeFile('./scripts/duplicate-ids.json', JSON.stringify(idsToDelete, null, 2));
      
      // Create the confirmation script
      const confirmScript = `
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function confirmDeleteDuplicates() {
  try {
    // Read IDs from file
    const data = await fs.readFile('./scripts/duplicate-ids.json', 'utf8');
    const idsToDelete = JSON.parse(data);
    
    console.log(\`Deleting \${idsToDelete.length} duplicate transactions...\`);
    
    // Delete transactions in batches
    const batchSize = 10;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      await prisma.transaction.deleteMany({
        where: {
          id: {
            in: batch
          }
        }
      });
      console.log(\`Deleted batch \${i/batchSize + 1} of \${Math.ceil(idsToDelete.length/batchSize)}\`);
    }
    
    console.log('Duplicate transactions deleted successfully.');
    
    // Clean up the temporary file
    await fs.unlink('./scripts/duplicate-ids.json');
    
  } catch (error) {
    console.error('Error deleting duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

confirmDeleteDuplicates();
      `;
      
      await fs.writeFile('./scripts/confirm-delete-duplicates.mjs', confirmScript);
      
    } else {
      console.log('No duplicates found. No action needed.');
    }
    
  } catch (error) {
    console.error('Error finding duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateTransactions(); 