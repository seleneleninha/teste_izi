-- Add role column to perfis table
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Corretor';

-- Update existing users to have 'Corretor' role if null
UPDATE perfis SET role = 'Corretor' WHERE role IS NULL;

-- Create policy for admins (optional, but good practice)
-- For now, we rely on the application logic, but in production we should have RLS policies based on role.
