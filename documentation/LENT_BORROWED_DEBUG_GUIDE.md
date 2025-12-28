# Lent/Borrowed Transaction Debug Guide

## What Was Fixed

### 1. **Transaction Type Support**
- Added support for 'lent' and 'borrowed' types in:
  - `TransactionContext.tsx` - optimistic UI updates
  - `calculateLocalAggregates` - offline balance calculations
  - Delete transaction handling

### 2. **Comprehensive Logging Added**
The app now logs detailed information to help debug issues:

#### In `TransactionContext.tsx`:
- `[TX]` prefix for transaction operations
- Logs when adding online vs offline
- Logs full error details including Supabase error codes

#### In `useOfflineSync.ts`:
- `[SYNC]` prefix for sync operations
- Logs each step of the sync process
- Logs the exact data being sent to the API
- Logs detailed error information

## How to Test

### Step 1: Start the App
```bash
npx expo start
```

### Step 2: Open Developer Tools
- Press `j` to open the debugger
- Open the browser console to see logs

### Step 3: Test Lent Transaction
1. Open the app
2. Click "Add Transaction"
3. Select "Lent" type
4. Choose a category (e.g., "Lent to Friend")
5. Enter an amount
6. Click "Save Transaction"

### Step 4: Check the Logs
Look for logs in this order:

**If Online:**
```
[TX] Adding transaction: { type: 'lent', category: 'lent_friend', amount: 100, online: true }
[TX] Online - adding directly to database
[TX] Transaction added successfully
```

**If there's an error:**
```
[TX] Error adding transaction: { error: '...', details: '...', code: '...', type: 'lent' }
[TX] Falling back to offline queue
```

**Then when syncing:**
```
[SYNC] Processing add transaction: { pendingId: '...', transactionType: 'lent', transactionId: 'temp_...' }
[SYNC] Add transaction data: { type: 'lent', category: 'lent_friend', amount: 100, title: '...', date: '...' }
[SYNC] Calling API to add transaction...
```

**If sync fails:**
```
[SYNC] Failed to sync add transaction ...: { error: '...', details: '...', code: '...', transactionType: 'lent' }
```

### Step 5: Test Borrowed Transaction
Repeat the same steps but select "Borrowed" type.

## Common Issues to Look For

### Issue 1: Database Schema Not Updated
**Error**: `new row violates check constraint "transactions_type_check"`
**Solution**: Run the `supabase_schema.sql` file in your Supabase SQL Editor

### Issue 2: RPC Function Not Updated
**Error**: Balance calculations are wrong
**Solution**: Run the `supabase_rpc.sql` file in your Supabase SQL Editor

### Issue 3: Missing Fields
**Error**: `[SYNC] Missing required fields for add transaction`
**Solution**: Check the logged data to see which field is missing

### Issue 4: Date Format Issue
**Error**: `invalid input syntax for type timestamp`
**Solution**: The date should be in ISO format (YYYY-MM-DDTHH:MM:SS.SSSZ)

## What to Report

If you still see sync errors, please provide:

1. **The exact error message** from the console logs
2. **The transaction data** being logged (look for `[SYNC] Add transaction data:`)
3. **The error details** (look for `[SYNC] Failed to sync` or `[TX] Error adding transaction`)
4. **Whether you're online or offline** when the error occurs

## Database Verification

To verify your database supports lent/borrowed:

1. Go to Supabase SQL Editor
2. Run this query:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transactions';
```

3. Check that the `type` column has a check constraint that includes 'lent' and 'borrowed'

4. Run this to see the constraint:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
AND conname LIKE '%type%';
```

You should see: `CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'lent'::text, 'borrowed'::text])))`
