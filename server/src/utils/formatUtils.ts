/**
 * Utility functions for standardizing data formats
 */

/**
 * Converts a string to title case
 * @param str String to convert
 * @returns String in title case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a number to have exactly 2 decimal places
 * @param num Number to format
 * @returns Number with 2 decimal places
 */
export const formatAmount = (num: number): number => {
  return parseFloat(num.toFixed(2));
};

/**
 * Formats a description string by removing extra spaces and converting to title case
 * @param description Description to format
 * @returns Formatted description
 */
export const formatDescription = (description: string): string => {
  if (!description) return '';
  
  // Remove extra spaces and trim
  const trimmed = description.replace(/\s+/g, ' ').trim();
  
  // Convert to title case
  return toTitleCase(trimmed);
};

/**
 * Formats a category string by converting to title case
 * @param category Category to format
 * @returns Formatted category
 */
export const formatCategory = (category: string): string => {
  return toTitleCase(category);
};

/**
 * Standardizes a transaction record by formatting all fields
 * @param transaction Transaction record to standardize
 * @returns Standardized transaction record
 */
export const standardizeTransaction = (transaction: any): any => {
  return {
    ...transaction,
    amount: formatAmount(transaction.amount),
    description: formatDescription(transaction.description || ''),
    category: formatCategory(transaction.category || ''),
    type: transaction.type?.toLowerCase() || '',
  };
};

/**
 * Standardizes a staging transaction record by formatting all fields
 * @param transaction Staging transaction record to standardize
 * @returns Standardized staging transaction record
 */
export const standardizeStagingTransaction = (transaction: any): any => {
  return {
    ...transaction,
    amount: formatAmount(transaction.amount),
    description: formatDescription(transaction.description || ''),
    category: formatCategory(transaction.category || ''),
    type: transaction.type?.toLowerCase() || '',
    bankName: transaction.bankName ? toTitleCase(transaction.bankName) : undefined,
    source: transaction.source?.toLowerCase() || '',
  };
}; 