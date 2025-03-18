# CSV to Transaction Table Integration Guide

This guide explains how to update your Transaction table schema to align with the CSV testing files and import the data.

## Schema Alignment Steps

### 1. Execute the SQL Schema Update

Run the `simple_schema_update.sql` script in the Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query and paste the contents of the `simple_schema_update.sql` file
4. Run the query

This will add the following fields to your Transaction table:
- `vendor` (for "Card Member" data)
- `accountNumber` (for "Account #" data)
- `originalDescription` (for preserving raw descriptions)
- `source` (to track transaction origin)
- `bankName` (to identify financial institution)

### 2. Update the Prisma Schema (Optional but Recommended)

If you use Prisma in your development workflow, update your Prisma schema with the new fields:

```prisma
model Transaction {
  // Existing fields
  id                 String              @id @default(uuid())
  amount             Float
  type               String              // "income" or "expense"
  category           String
  description        String?
  date               DateTime            @default(now())
  userId             String
  accountId          String?
  
  // New fields for CSV integration
  originalDescription String?            // Original description from import source
  vendor             String?             // Vendor name, from Card Member field
  accountNumber      String?             // Account number from the CSV
  source             String?             // Source of the transaction (e.g., "csv", "manual", "api")
  bankName           String?             // Name of the bank/financial institution
  
  // Standard timestamps and relations
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  // Relations...
}
```

## Data Import Options

### Option 1: CSV Transformation for Direct Upload

1. Install the required dependencies:
   ```bash
   npm install csv-parser csv-writer uuid
   ```

2. Edit the `transform_csv_for_import.js` script to include your actual user ID and account IDs:
   ```javascript
   const CONFIG = {
     userId: 'your-actual-user-id',
     accountMappings: {
       '-71002': {
         accountId: 'your-credit-card-account-id',
         type: 'credit',
         bankName: 'American Express'
       },
       'default-checking': {
         accountId: 'your-checking-account-id',
         type: 'checking',
         bankName: 'Chase'
       }
     }
   };
   ```

3. Run the script to transform the CSV files:
   ```bash
   node server/scripts/transform_csv_for_import.js
   ```

4. Find the transformed CSV files in the `transformed-csv` directory

5. Upload the transformed CSV files directly to the Transaction table in Supabase using the Table Editor:
   - Go to the Table Editor in Supabase
   - Select the Transaction table
   - Click "Import" and select your transformed CSV file
   - Follow the prompts to complete the import

### Option 2: SQL Direct Import

1. Create a temporary table in Supabase matching the CSV structure:
   ```sql
   CREATE TABLE temp_csv_transactions (
     "Date" TEXT,
     "Description" TEXT,
     "Card Member" TEXT,
     "Account #" TEXT,
     "Amount" TEXT,
     "Category" TEXT
   );
   ```

2. Upload your CSV files directly to this temporary table

3. Execute the import function from `transaction_schema_update.sql` to process the imported data:
   ```sql
   SELECT import_csv_transactions(
     'your-user-id'::UUID, 
     'your-checking-account-id'::UUID, 
     'your-credit-account-id'::UUID
   );
   ```

## Field Mapping Reference

Refer to the `csv_field_mapping.md` document for detailed information on how fields from the CSV files map to the Transaction table. 