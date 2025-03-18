-- Simple SQL Schema Update for Transaction Table
-- Execute this script in Supabase SQL Editor to add missing fields needed for CSV import

-- Add missing columns to the Transaction table to match CSV fields
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "vendor" TEXT;              -- Maps to "Card Member" 
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;       -- Maps to "Account #"
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "originalDescription" TEXT; -- Preserves original description
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "source" TEXT;              -- Tracks transaction source
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bankName" TEXT;            -- Financial institution

-- Add comments for clarity
COMMENT ON COLUMN "Transaction"."vendor" IS 'Stores Card Member information from CSV imports';
COMMENT ON COLUMN "Transaction"."accountNumber" IS 'Stores Account # information from CSV imports';
COMMENT ON COLUMN "Transaction"."originalDescription" IS 'Preserves original unmodified description';
COMMENT ON COLUMN "Transaction"."source" IS 'Identifies source of transaction (e.g., csv, manual)';
COMMENT ON COLUMN "Transaction"."bankName" IS 'Name of bank or financial institution';

-- Show updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Transaction'
ORDER BY ordinal_position; 