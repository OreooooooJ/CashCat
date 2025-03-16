import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Updates an account's balance based on a transaction
 * @param accountId The account ID
 * @param transactionType The transaction type (income or expense)
 * @param amount The transaction amount (always positive)
 * @param isAddition Whether the transaction is being added (true) or removed (false)
 */
export async function updateAccountBalanceForTransaction(
  accountId: string | null,
  transactionType: string,
  amount: number,
  isAddition: boolean
): Promise<void> {
  if (!accountId) return;
  
  try {
    // Get the account
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      console.error(`Account with ID ${accountId} not found`);
      return;
    }
    
    // Normalize transaction type
    const type = transactionType.toLowerCase();
    
    // Calculate the balance adjustment
    let balanceAdjustment = 0;
    
    if (account.type.toLowerCase() === 'credit') {
      // For credit accounts:
      // - Expenses (purchases) increase the balance (positive)
      // - Income (payments) decrease the balance (negative)
      if (type === 'expense') {
        balanceAdjustment = amount;
      } else if (type === 'income') {
        balanceAdjustment = -amount;
      }
    } else {
      // For debit/cash accounts:
      // - Income increases the balance (positive)
      // - Expenses decrease the balance (negative)
      if (type === 'income') {
        balanceAdjustment = amount;
      } else if (type === 'expense') {
        balanceAdjustment = -amount;
      }
    }
    
    // If we're removing a transaction, reverse the adjustment
    if (!isAddition) {
      balanceAdjustment = -balanceAdjustment;
    }
    
    // Update the account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { 
        balance: {
          increment: balanceAdjustment
        }
      }
    });
    
    console.log(`Updated balance for account ${account.name}: ${account.balance} -> ${account.balance + balanceAdjustment}`);
    
  } catch (error) {
    console.error('Error updating account balance:', error);
  }
}

/**
 * Recalculates an account's balance based on all its transactions
 * @param accountId The account ID
 */
export async function recalculateAccountBalance(accountId: string): Promise<void> {
  try {
    // Get the account
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      console.error(`Account with ID ${accountId} not found`);
      return;
    }
    
    // Get all transactions for this account
    const transactions = await prisma.transaction.findMany({
      where: { accountId }
    });
    
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
    
    // Update the account balance if it's different
    if (account.balance !== calculatedBalance) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: calculatedBalance }
      });
      
      console.log(`Recalculated balance for account ${account.name}: ${account.balance} -> ${calculatedBalance}`);
    }
    
  } catch (error) {
    console.error('Error recalculating account balance:', error);
  }
} 