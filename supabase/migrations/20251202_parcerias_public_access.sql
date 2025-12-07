-- Enable public SELECT access to parcerias table
-- This allows unauthenticated users to view partnerships on public broker pages

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users on parcerias" ON parcerias;

-- Create new policy for public read access
CREATE POLICY "Enable read access for all users on parcerias" 
ON parcerias 
FOR SELECT 
USING (true);
