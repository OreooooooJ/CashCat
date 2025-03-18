-- SQL Script to update Transaction table in Supabase to match CSV files
-- This script adds additional columns to maintain all information from CSV files
-- while preserving existing functionality

-- 1. First check if columns already exist to avoid errors
DO $$
BEGIN
    -- Check and add originalDescription column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Transaction' AND column_name = 'originalDescription') THEN
        ALTER TABLE "Transaction" ADD COLUMN "originalDescription" TEXT;
    END IF;

    -- Check and add vendor column (for Card Member field)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Transaction' AND column_name = 'vendor') THEN
        ALTER TABLE "Transaction" ADD COLUMN "vendor" TEXT;
    END IF;

    -- Check and add accountNumber column (for Account # field)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Transaction' AND column_name = 'accountNumber') THEN
        ALTER TABLE "Transaction" ADD COLUMN "accountNumber" TEXT;
    END IF;

    -- Check and add source column (tracks where transaction came from)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Transaction' AND column_name = 'source') THEN
        ALTER TABLE "Transaction" ADD COLUMN "source" TEXT;
    END IF;

    -- Check and add bankName column (identifies financial institution)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Transaction' AND column_name = 'bankName') THEN
        ALTER TABLE "Transaction" ADD COLUMN "bankName" TEXT;
    END IF;

    -- Adding optional comment to explain column usage
    COMMENT ON COLUMN "Transaction"."originalDescription" IS 'Original unmodified description from import source';
    COMMENT ON COLUMN "Transaction"."vendor" IS 'Vendor name, often derived from Card Member field in CSVs';
    COMMENT ON COLUMN "Transaction"."accountNumber" IS 'Account number from CSV import, masked for security';
    COMMENT ON COLUMN "Transaction"."source" IS 'Source of transaction (e.g., csv, manual, api)';
    COMMENT ON COLUMN "Transaction"."bankName" IS 'Name of bank or financial institution';
END $$;

-- 2. Create a view to make direct CSV import easier
DROP VIEW IF EXISTS csv_transaction_import_view;
CREATE VIEW csv_transaction_import_view AS
SELECT 
    id,
    amount,
    type,
    category,
    description,
    date,
    "userId",
    "accountId",
    "vendor",
    "accountNumber",
    "originalDescription",
    "bankName",
    "source",
    "createdAt",
    "updatedAt"
FROM "Transaction";

-- 3. Create a temporary mapping table for importing directly from CSV
CREATE TABLE IF NOT EXISTS temp_csv_transactions (
    "Date" TEXT,
    "Description" TEXT,
    "Card Member" TEXT,
    "Account #" TEXT,
    "Amount" TEXT,
    "Category" TEXT
);

-- 4. Create a function to help with importing CSV data
CREATE OR REPLACE FUNCTION import_csv_transactions(
    p_user_id UUID,
    p_checking_account_id UUID,
    p_credit_account_id UUID
) RETURNS TEXT AS $$
DECLARE
    temp_row RECORD;
    account_id UUID;
    transaction_type TEXT;
    amount_value FLOAT;
    date_value TIMESTAMP;
    rows_imported INTEGER := 0;
BEGIN
    -- Process each row in the temp table
    FOR temp_row IN (SELECT * FROM temp_csv_transactions) LOOP
        -- Parse date (MM/DD/YYYY format)
        BEGIN
            date_value := TO_TIMESTAMP(temp_row."Date", 'MM/DD/YYYY');
        EXCEPTION WHEN OTHERS THEN
            -- Default to current date if parsing fails
            date_value := CURRENT_TIMESTAMP;
        END;
        
        -- Parse amount
        BEGIN
            amount_value := ABS(temp_row."Amount"::FLOAT);
        EXCEPTION WHEN OTHERS THEN
            -- Default to zero if parsing fails
            amount_value := 0;
        END;
        
        -- Determine transaction type and account based on account number
        IF temp_row."Account #" = '-71002' THEN  -- Amex account
            account_id := p_credit_account_id;
            -- For credit cards: positive = expense, negative = payment/income
            IF temp_row."Amount"::FLOAT > 0 THEN
                transaction_type := 'expense';
            ELSE
                transaction_type := 'income';
            END IF;
        ELSE  -- Chase accounts
            account_id := p_checking_account_id;
            -- For checking accounts: positive = income, negative = expense
            IF temp_row."Amount"::FLOAT > 0 THEN
                transaction_type := 'income';
            ELSE
                transaction_type := 'expense';
            END IF;
        END IF;
        
        -- Insert into Transaction table
        INSERT INTO "Transaction" (
            id, amount, type, category, description, date, 
            "userId", "accountId", "createdAt", "updatedAt",
            "originalDescription", "vendor", "accountNumber", "source", "bankName"
        ) VALUES (
            gen_random_uuid(), 
            amount_value, 
            transaction_type, 
            COALESCE(temp_row."Category", 'Uncategorized'), 
            temp_row."Description", 
            date_value,
            p_user_id, 
            account_id, 
            NOW(), 
            NOW(),
            temp_row."Description",
            temp_row."Card Member",
            temp_row."Account #",
            'csv',
            CASE 
                WHEN temp_row."Account #" = '-71002' THEN 'American Express'
                ELSE 'Chase'
            END
        );
        
        rows_imported := rows_imported + 1;
    END LOOP;
    
    RETURN 'Successfully imported ' || rows_imported || ' transactions';
END;
$$ LANGUAGE plpgsql;

-- Usage instructions:
/*
To import transactions:

1. Upload your CSV file to the temp_csv_transactions table using Supabase Table Editor
   - Make sure the CSV has headers: "Date", "Description", "Card Member", "Account #", "Amount", "Category"

2. Get your user ID and account IDs:
   SELECT id FROM "User" WHERE email = 'your-email@example.com';
   SELECT id FROM "Account" WHERE name = 'Your Account Name';

3. Run the import function:
   SELECT import_csv_transactions(
     'your-user-id-here'::UUID, 
     'your-checking-account-id-here'::UUID, 
     'your-credit-account-id-here'::UUID
   );

4. After importing, you can drop the temporary table:
   TRUNCATE TABLE temp_csv_transactions;
*/ 