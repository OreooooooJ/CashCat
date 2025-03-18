# Data Formatting Guidelines

This document outlines the standardized formatting rules for data in the CashCat application.

## Overview

To ensure consistency across the application, all data is formatted according to specific rules before being stored in the database. This includes:

- Converting string fields (e.g., descriptions, categories) to a consistent case (title case)
- Formatting numeric values to a consistent decimal precision (2 decimal places)
- Standardizing transaction types (lowercase)

## Formatting Rules

### String Fields

- **Descriptions**: Title case (e.g., "Grocery Shopping")
- **Categories**: Title case (e.g., "Food & Dining")
- **Bank Names**: Title case (e.g., "Bank Of America")
- **Transaction Types**: Lowercase (e.g., "income", "expense")
- **Sources**: Lowercase (e.g., "csv", "manual", "api")

### Numeric Fields

- **Amounts**: Always formatted to 2 decimal places (e.g., 123.45)
- **Balances**: Always formatted to 2 decimal places (e.g., 1000.00)

## Utility Functions

The formatting utilities are located in `src/utils/formatUtils.ts` and include:

- `toTitleCase(str)`: Converts a string to title case
- `formatAmount(num)`: Formats a number to have exactly 2 decimal places
- `formatDescription(description)`: Formats a description string
- `formatCategory(category)`: Formats a category string
- `standardizeTransaction(transaction)`: Standardizes a transaction record
- `standardizeStagingTransaction(transaction)`: Standardizes a staging transaction record

## Usage

### In Seed Scripts

All seed scripts should use the formatting utilities to ensure consistent data:

```typescript
import { formatAmount, formatCategory, standardizeTransaction } from '../utils/formatUtils.js';

// Format individual fields
const budget = {
  category: formatCategory('Food & Dining'),
  amount: formatAmount(500),
  // ...
};

// Or standardize an entire transaction
const standardizedTransaction = standardizeTransaction(transaction);
await prisma.transaction.create({
  data: standardizedTransaction,
});
```

### In CSV Import

When importing data from CSV files, the data is standardized before being stored:

```typescript
// Create standardized transaction data
const transactionData = {
  amount: Math.abs(amount),
  type,
  description: transformedDescription,
  // ...
};

// Standardize the transaction data
const standardizedTransaction = standardizeStagingTransaction(transactionData);
```

### In API Endpoints

When creating or updating records through API endpoints, the data should be standardized:

```typescript
// Get data from request body
const { amount, type, category, description } = req.body;

// Standardize the data
const standardizedData = {
  amount: formatAmount(amount),
  type: type.toLowerCase(),
  category: formatCategory(category),
  description: formatDescription(description),
  // ...
};

// Create or update the record
await prisma.transaction.create({
  data: standardizedData,
});
```

## Testing

The formatting utilities have comprehensive tests in `tests/format-utils.test.ts`. Run the tests with:

```bash
yarn test tests/format-utils.test.ts
```

## Benefits

Standardizing data formatting provides several benefits:

1. **Consistency**: All data is stored in a consistent format, making it easier to display and process
2. **Improved Search**: Consistent casing makes text search more reliable
3. **Better Reporting**: Consistent numeric formatting ensures accurate calculations
4. **User Experience**: Consistent formatting improves readability and user experience 