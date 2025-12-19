-- EXECUTE NO SUPABASE SQL EDITOR
-- Ver o código da função validate_numeric_values

SELECT 
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'validate_numeric_values';
