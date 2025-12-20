-- Function to calculate total income, expense, and balance for a user
-- This runs on the server side (Postgres) to avoid downloading all transaction history
-- Run this SQL query in your Supabase SQL Editor to enable server-side aggregation.

CREATE OR REPLACE FUNCTION get_balance_stats(user_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_income NUMERIC := 0;
  total_expense NUMERIC := 0;
BEGIN
  -- Calculate total income (Income + Borrowed)
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM transactions
  WHERE user_id = user_id_input AND (type = 'income' OR type = 'borrowed');

  -- Calculate total expense (Expense + Lent)
  SELECT COALESCE(SUM(amount), 0) INTO total_expense
  FROM transactions
  WHERE user_id = user_id_input AND (type = 'expense' OR type = 'lent');

  -- Return totals
  RETURN json_build_object(
    'income', total_income,
    'expense', total_expense,
    'balance', total_income - total_expense
  );
END;
$$;
