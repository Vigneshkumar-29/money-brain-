-- ALTERNATIVE SOLUTION: Remove the trigger and handle updated_at in code
-- Use this if you prefer to manage updated_at from the application layer

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 3: Ensure updated_at column exists (optional, can be removed if you don't need it)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Success message
SELECT 'Trigger removed - updated_at will be managed by application code' as status;
