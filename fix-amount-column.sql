-- Fix for numeric field overflow
-- Problem: numeric(20,18) only allows 2 digits before decimal (max: 99.99...)
-- Solution: Change to numeric(30,18) for flexibility with large amounts
-- 
-- numeric(30,18) allows:
-- - 12 digits before decimal
-- - 18 digits after decimal  
-- - Max: 999,999,999,999.999999999999999999 tokens
-- - Maintains flexibility for various token decimals
--
-- Safe to run: ALTER TYPE is non-blocking and won't lose data

-- Change claims.amount from decimal(20,18) to decimal(30,18)
ALTER TABLE claims ALTER COLUMN amount TYPE numeric(30, 18);

-- Also update claim_limits.standard_amount for consistency
ALTER TABLE claim_limits ALTER COLUMN standard_amount TYPE numeric(30, 18);

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale 
FROM information_schema.columns 
WHERE (table_name = 'claims' AND column_name = 'amount')
   OR (table_name = 'claim_limits' AND column_name = 'standard_amount')
ORDER BY table_name, column_name;

-- Test: This should now work (was failing before)
-- SELECT 1000.00::numeric(30,18) as test_amount;

