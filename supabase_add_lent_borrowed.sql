-- ============================================
-- FIX: Add Lent/Borrowed Support to Database
-- ============================================
-- Run this in your Supabase SQL Editor to fix the timeout issue

-- Step 1: Drop the old constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Step 2: Add the new constraint with lent and borrowed
ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'lent', 'borrowed'));

-- Step 3: Verify the change (optional)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
AND conname LIKE '%type%';

-- You should see output like:
-- transactions_type_check | CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'lent'::text, 'borrowed'::text])))
