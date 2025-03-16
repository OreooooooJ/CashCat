import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define keyword-to-category mappings
const categoryMappings = [
  { keywords: ['WALMART', 'TARGET', 'COSTCO', 'WALGREENS', 'CVS'], category: 'Retail' },
  { keywords: ['STOP & SHOP', 'KROGER', 'ALDI', 'TRADER JOE', 'WHOLE FOODS', 'SAFEWAY'], category: 'Groceries' },
  { keywords: ['AMAZON', 'EBAY', 'ETSY', 'SHOPIFY', 'ALIEXPRESS'], category: 'Online Shopping' },
  { keywords: ['UBER EATS', 'DOORDASH', 'GRUBHUB', 'MCDONALD', 'STARBUCKS', 'CHIPOTLE', 'RESTAURANT', 'PIZZA'], category: 'Dining' },
  { keywords: ['NETFLIX', 'HULU', 'DISNEY', 'SPOTIFY', 'APPLE MUSIC', 'HBO', 'PRIME VIDEO', 'YOUTUBE', 'OPENAI', 'CHATGPT'], category: 'Subscription' },
  { keywords: ['UBER', 'LYFT', 'TAXI', 'TRANSIT', 'SUBWAY', 'BUS', 'TRAIN', 'AMTRAK', 'AIRLINE', 'FLIGHT'], category: 'Transportation' },
  { keywords: ['RENT', 'MORTGAGE', 'APARTMENT', 'HOUSING', 'LEASE'], category: 'Housing' },
  { keywords: ['ELECTRIC', 'GAS', 'WATER', 'INTERNET', 'CABLE', 'PHONE', 'UTILITY'], category: 'Utilities' },
  { keywords: ['DOCTOR', 'HOSPITAL', 'PHARMACY', 'MEDICAL', 'HEALTH', 'DENTAL', 'VISION'], category: 'Healthcare' },
  { keywords: ['SCHOOL', 'TUITION', 'UNIVERSITY', 'COLLEGE', 'EDUCATION', 'COURSE', 'BOOK'], category: 'Education' },
  { keywords: ['GYM', 'FITNESS', 'SPORT', 'EXERCISE'], category: 'Fitness' },
  { keywords: ['PAYCHECK', 'SALARY', 'DEPOSIT', 'INCOME', 'PAYMENT'], category: 'Income' },
];

// Default category when no keywords match
const DEFAULT_CATEGORY = 'Other';

/**
 * Process a transaction by analyzing its description and assigning a category
 * @param transaction The transaction object with at least a Description field
 * @param userId The ID of the current user
 * @returns The augmented transaction object with category and user_id
 */
export const processTransaction = (transaction: any, userId: string) => {
  // Ensure description exists and convert to uppercase for case-insensitive matching
  const description = (transaction.description || '').toUpperCase();
  
  // Find matching category based on keywords
  let category = DEFAULT_CATEGORY;
  
  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => description.includes(keyword))) {
      category = mapping.category;
      break;
    }
  }
  
  // Augment transaction with category and user ID
  return {
    ...transaction,
    category,
    userId,
  };
};

/**
 * Log a category change for a transaction
 * @param transactionId The ID of the transaction
 * @param previousCategory The previous category
 * @param newCategory The new category
 * @param userId The ID of the user making the change
 * @returns The created log entry
 */
export const logCategoryChange = async (
  transactionId: string,
  previousCategory: string,
  newCategory: string,
  userId: string
) => {
  try {
    // Create a log entry in the database
    const logEntry = await prisma.categoryChangeLog.create({
      data: {
        transactionId,
        previousCategory,
        newCategory,
        userId,
        timestamp: new Date(),
      },
    });
    
    return logEntry;
  } catch (error) {
    console.error('Error logging category change:', error);
    throw error;
  }
};

/**
 * Update a transaction's category
 * @param transactionId The ID of the transaction
 * @param newCategory The new category
 * @param userId The ID of the user making the change
 * @returns The updated transaction
 */
export const updateTransactionCategory = async (
  transactionId: string,
  newCategory: string,
  userId: string
) => {
  try {
    // Get the current transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.userId !== userId) {
      throw new Error('Not authorized to update this transaction');
    }
    
    const previousCategory = transaction.category;
    
    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { category: newCategory },
    });
    
    // Log the category change
    await logCategoryChange(
      transactionId,
      previousCategory,
      newCategory,
      userId
    );
    
    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction category:', error);
    throw error;
  }
}; 