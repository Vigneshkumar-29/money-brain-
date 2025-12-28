# 🔧 Fix Timeout Issue for Lent/Borrowed Transactions

## Problem
When adding lent or borrowed transactions, the save button takes too long (8+ seconds) and shows "check your internet connection" error.

## Root Cause
Your Supabase database doesn't have the constraint updated to support 'lent' and 'borrowed' transaction types. The database is rejecting these transactions, causing a timeout.

---

## ✅ Solution: Update Your Supabase Database

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Copy and Run This SQL

Copy the entire SQL below and paste it into the SQL Editor:

```sql
-- Fix: Add Lent/Borrowed Support
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'lent', 'borrowed'));
```

### Step 3: Click "RUN" Button

Click the **RUN** button (or press Ctrl+Enter / Cmd+Enter)

You should see: **Success. No rows returned**

### Step 4: Verify (Optional)

Run this query to verify the change:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
AND conname LIKE '%type%';
```

Expected output:
```
transactions_type_check | CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'lent'::text, 'borrowed'::text])))
```

---

## 🧪 Test After Update

1. **Restart your app** (if running)
   ```bash
   npx expo start
   ```

2. **Try adding a Lent transaction**:
   - Click "Add Transaction"
   - Select "Lent"
   - Choose "Lent to Friend"
   - Enter amount: 500
   - Click "Save"

3. **Should now save in ~1-2 seconds** ✅

---

## 🎯 What Changed in the App

I also made these improvements:

1. **Reduced timeout** from 15 seconds to 8 seconds
   - Faster error feedback
   - Less waiting time

2. **Better error message**
   - Now says: "Save timed out. Please check your connection or database schema."
   - Hints at the database issue

3. **Comprehensive logging**
   - Check browser console for detailed error messages
   - Look for `[TX]` and `[SYNC]` logs

---

## 🚨 If Still Having Issues

### Check Console Logs

Open the browser debugger (press `j` in Expo terminal) and look for:

```
[TX] Error adding transaction: { 
  error: "...", 
  code: "23514",  // ← This means constraint violation
  type: "lent" 
}
```

If you see **code: "23514"**, it means the database constraint is still blocking lent/borrowed.

### Verify Your Database

Run this in Supabase SQL Editor:

```sql
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass;
```

Look for `transactions_type_check` - it should include 'lent' and 'borrowed'.

### Alternative: Recreate Table

If the constraint update doesn't work, you can recreate the table (⚠️ **This will delete all data**):

```sql
-- DANGER: This deletes all transactions!
DROP TABLE IF EXISTS transactions CASCADE;

-- Then run the full schema from supabase_schema.sql
```

---

## 📝 Files Created

- `supabase_add_lent_borrowed.sql` - Quick SQL fix script
- This guide - Step-by-step instructions

---

## ✅ Summary

**The timeout is caused by your database rejecting lent/borrowed transactions.**

**To fix:**
1. Run the SQL update in Supabase SQL Editor
2. Restart your app
3. Test adding lent/borrowed transactions

**After the fix, transactions should save in 1-2 seconds instead of timing out!** 🎉
