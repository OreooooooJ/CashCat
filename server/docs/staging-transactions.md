# Staging Transactions for CSV Import

This document describes the staging transaction functionality for CSV imports in the CashCat application.

## Overview

The staging transaction system provides a two-step process for importing transactions from CSV files:

1. **Import to Staging**: CSV data is first imported into a staging table, where it can be reviewed and validated before being committed to the main transaction table.
2. **Process from Staging**: After review, selected transactions can be processed and moved to the main transaction table.

This approach provides several benefits:
- Allows for validation and correction of data before it affects account balances
- Provides a buffer for handling duplicate or problematic transactions
- Enables batch processing of transactions
- Preserves the original raw data for reference

## Database Schema

The `StagingTransaction` model in the Prisma schema includes:

```prisma
model StagingTransaction {
  id            String   @id @default(uuid())
  rawData       String   // Stores the entire raw CSV row (or JSON) for reference
  amount        Float
  type          String   // e.g., "income", "expense", "transfer", "payment"
  category      String?  // Auto-assigned category from CSV parsing
  description   String?  // Original description from CSV
  date          DateTime @default(now())
  bankName      String?  // Name of the bank or statement source
  source        String   // e.g., "csv", "manual", "api"
  userId        String
  accountId     String?  // Optional, if the transaction is linked to a specific account
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations:
  user          User     @relation(fields: [userId], references: [id])
  account       Account? @relation(fields: [accountId], references: [id])
}
```

## API Endpoints

### CSV Import

- `POST /api/transactions/import`: Imports transactions from a CSV file into the staging table
- `GET /api/transactions/import/formats`: Gets supported CSV formats

### Staging Transactions

- `GET /api/transactions/staging`: Gets all staging transactions for the authenticated user
- `POST /api/transactions/staging/process`: Processes selected staging transactions and moves them to the main transaction table
- `POST /api/transactions/staging/delete`: Deletes selected staging transactions

## Workflow

1. **Import CSV**:
   - User uploads a CSV file
   - System parses the file and creates staging transactions
   - Each staging transaction stores the raw CSV data and standardized fields

2. **Review Staging Transactions**:
   - User reviews the imported transactions in the staging area
   - User can select which transactions to process or delete

3. **Process Transactions**:
   - Selected transactions are processed and moved to the main transaction table
   - Account balances are updated
   - Staging transactions are deleted after successful processing

## Implementation Details

### Services

- `csvImportService.ts`: Handles CSV file parsing and creates staging transactions
- `stagingTransactionService.ts`: Provides functions for managing staging transactions
- `transactionProcessingService.ts`: Processes transactions and assigns categories

### Controllers

- `importController.ts`: Handles CSV file uploads
- `stagingTransactionController.ts`: Handles API endpoints for staging transactions

## Testing

Tests for the staging transaction functionality are available in:
- `staging-transaction.test.ts`: Tests for the staging transaction service

## Future Enhancements

Potential future enhancements for the staging transaction system:
- Add ability to edit staging transactions before processing
- Implement batch categorization of staging transactions
- Add support for more CSV formats
- Implement machine learning for better category assignment
- Add support for importing from other sources (e.g., bank APIs) 