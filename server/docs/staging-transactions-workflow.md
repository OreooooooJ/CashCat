# Staging Transactions Workflow

This document describes the workflow for using the staging transaction system for CSV imports in the CashCat application.

## Overview

The staging transaction system provides a two-step process for importing transactions from CSV files:

1. **Import to Staging**: CSV data is first imported into a staging table, where it can be reviewed and validated before being committed to the main transaction table.
2. **Process from Staging**: After review, selected transactions can be processed and moved to the main transaction table.

## Workflow

### 1. CSV Import

When a user uploads a CSV file:

1. The file is parsed and each row is converted to a staging transaction
2. The original CSV data is stored in the `rawData` field
3. The data is standardized and categorized
4. The staging transactions are stored in the database
5. The user is shown a list of the imported staging transactions

### 2. Review and Process

After import, the user can:

1. Review the imported transactions
2. Edit categories or other details if needed
3. Select which transactions to process
4. Process the selected transactions, which:
   - Creates new transactions in the main Transaction table
   - Updates account balances
   - Deletes the processed staging transactions

## API Endpoints

### CSV Import

- `POST /api/transactions/import`: Imports transactions from a CSV file into the staging table
- `GET /api/transactions/import/formats`: Gets supported CSV formats

### Staging Transactions

- `GET /api/transactions/staging`: Gets all staging transactions for the authenticated user
- `POST /api/transactions/staging/process`: Processes selected staging transactions and moves them to the main transaction table
- `POST /api/transactions/staging/delete`: Deletes selected staging transactions

## Testing the Workflow

### Manual Testing

1. **Seed the Database**:
   ```bash
   yarn seed        # Seed main data (if needed)
   yarn seed:staging # Seed staging transactions
   ```

2. **Import a CSV File**:
   - Use the UI to upload a CSV file
   - Verify that staging transactions are created

3. **Process Staging Transactions**:
   - Select transactions in the UI
   - Process them
   - Verify that they appear in the main transactions list
   - Verify that account balances are updated correctly

### Automated Testing

Run the staging transaction tests:

```bash
yarn test tests/staging-transaction.test.ts
```

These tests verify:
- Creating staging transactions
- Retrieving staging transactions
- Processing staging transactions
- Deleting staging transactions

## Data Persistence

The staging transaction system is designed to work with the persistent Supabase database:

1. Staging transactions persist between development restarts
2. The system uses non-destructive schema updates (`prisma db push`)
3. Seeding is performed manually only when needed

## Supported CSV Formats

The system currently supports the following CSV formats:

- Chase
- Bank of America
- Wells Fargo

To add support for additional formats, update the `bankFormats` array in `csvImportService.ts`. 