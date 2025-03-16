import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTransactionTypes() {
  try {
    // Get all transactions
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      }
    });
    console.log(`Total transactions in database: ${allTransactions.length}`);
    
    // Track transactions that need updating
    const transactionsToUpdate = [];
    
    // Check each transaction
    for (const transaction of allTransactions) {
      let needsUpdate = false;
      let updatedType = transaction.type.toLowerCase();
      
      // Check if type is uppercase or mixed case
      if (updatedType !== transaction.type) {
        console.log(`Transaction ${transaction.id} has type "${transaction.type}" which needs to be normalized to "${updatedType}"`);
        needsUpdate = true;
      }
      
      // Check if type is valid
      if (updatedType !== 'income' && updatedType !== 'expense') {
        console.log(`Transaction ${transaction.id} has invalid type "${updatedType}", defaulting to "expense"`);
        updatedType = 'expense';
        needsUpdate = true;
      }
      
      // Check if type is correct based on account type
      if (transaction.account && transaction.account.type) {
        const accountType = transaction.account.type.toLowerCase();
        
        if (accountType === 'credit') {
          // For credit cards: positive = expense, negative = income (payment)
          const correctType = transaction.amount > 0 ? 'expense' : 'income';
          
          if (updatedType !== correctType) {
            console.log(`Credit card transaction ${transaction.id} has incorrect type "${updatedType}", should be "${correctType}" based on amount ${transaction.amount}`);
            updatedType = correctType;
            needsUpdate = true;
          }
        } else if (accountType === 'debit') {
          // For debit accounts: positive = income, negative = expense
          const correctType = transaction.amount > 0 ? 'income' : 'expense';
          
          if (updatedType !== correctType) {
            console.log(`Debit account transaction ${transaction.id} has incorrect type "${updatedType}", should be "${correctType}" based on amount ${transaction.amount}`);
            updatedType = correctType;
            needsUpdate = true;
          }
        }
      }
      
      // Add to update list if needed
      if (needsUpdate) {
        transactionsToUpdate.push({
          id: transaction.id,
          type: updatedType
        });
      }
    }
    
    // Update transactions if needed
    if (transactionsToUpdate.length > 0) {
      console.log(`\nUpdating ${transactionsToUpdate.length} transactions...`);
      
      // Update transactions in batches
      const batchSize = 10;
      for (let i = 0; i < transactionsToUpdate.length; i += batchSize) {
        const batch = transactionsToUpdate.slice(i, i + batchSize);
        
        // Update each transaction in the batch
        await Promise.all(batch.map(async (t) => {
          await prisma.transaction.update({
            where: { id: t.id },
            data: { type: t.type }
          });
        }));
        
        console.log(`Updated batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(transactionsToUpdate.length/batchSize)}`);
      }
      
      console.log('Transaction types updated successfully.');
    } else {
      console.log('No transactions need updating.');
    }
    
  } catch (error) {
    console.error('Error fixing transaction types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTransactionTypes(); 