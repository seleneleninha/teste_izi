-- Ensure public SELECT access to anuncios table for approved properties
-- This is critical for public broker pages and property listings

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for approved properties" ON anuncios;

-- Create policy for public read access to approved properties
CREATE POLICY "Enable read access for approved properties" 
ON anuncios 
FOR SELECT 
USING (status = 'ativo');
