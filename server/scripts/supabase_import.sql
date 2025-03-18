-- Instructions for importing CSV data to Transaction table in Supabase
-- 1. Upload your CSV file to a temporary table
-- 2. Run this script to transform and insert data from the temp table to Transaction
-- 3. Drop the temporary table when done

-- Step 1: Create a temporary table with structure matching CSV files
CREATE TABLE temp_transactions (
  "Date" TEXT,
  "Description" TEXT,
  "Card Member" TEXT,
  "Account #" TEXT,
  "Amount" TEXT,
  "Category" TEXT
);

-- Step 2: After uploading data to temp_transactions, transform and insert into Transaction
-- Replace 'your-user-id' with an actual user ID from your User table 
-- Replace 'your-checking-account-id' and 'your-credit-account-id' with actual Account IDs
DO $$
DECLARE
    user_id UUID := 'your-user-id';
    checking_account_id UUID := 'your-checking-account-id';
    credit_account_id UUID := 'your-credit-account-id';
    account_id UUID;
    transaction_type TEXT;
    amount_value FLOAT;
    date_value TIMESTAMP;
BEGIN
    -- Process each row in the temp table
    FOR temp_row IN (SELECT * FROM temp_transactions) LOOP
        -- Parse date (MM/DD/YYYY format)
        date_value := TO_TIMESTAMP(temp_row."Date", 'MM/DD/YYYY');
        
        -- Parse amount
        amount_value := ABS(temp_row."Amount"::FLOAT);
        
        -- Determine transaction type and account based on account number
        IF temp_row."Account #" = '-71002' THEN  -- Amex account
            account_id := credit_account_id;
            -- For credit cards: positive = expense, negative = payment/income
            IF temp_row."Amount"::FLOAT > 0 THEN
                transaction_type := 'expense';
            ELSE
                transaction_type := 'income';
            END IF;
        ELSE  -- Chase accounts
            account_id := checking_account_id;
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
            "userId", "accountId", "createdAt", "updatedAt"
        ) VALUES (
            gen_random_uuid(), 
            amount_value, 
            transaction_type, 
            COALESCE(temp_row."Category", 'Uncategorized'), 
            temp_row."Description", 
            date_value,
            user_id, 
            account_id, 
            NOW(), 
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE 'Import completed successfully';
END $$;

-- Step 3: Once data is imported, drop the temporary table
-- DROP TABLE temp_transactions; 