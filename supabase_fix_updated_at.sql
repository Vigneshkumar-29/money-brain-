-- COMPLETE FIX for Money Brain Application
-- Run this in your Supabase SQL Editor to fix the updated_at issue

-- Step 1: Add updated_at column if it doesn't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Step 2: Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

-- Step 3: Recreate the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify the column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'updated_at column does not exist in transactions table';
    END IF;
END $$;

-- Success message
SELECT 'updated_at column and trigger successfully configured!' as status;
