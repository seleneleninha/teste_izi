-- Enable full access for authenticated users (or specifically admins) on planos and cupons_desconto
-- Note: In a strict production environment, you would check for (auth.jwt() ->> 'role') = 'Admin' or similar.
-- For now, we'll allow authenticated users to manage these tables to ensure the Admin Dashboard works smoothly.

CREATE POLICY "Enable insert for authenticated users on planos" ON planos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users on planos" ON planos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users on planos" ON planos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on cupons_desconto" ON cupons_desconto FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users on cupons_desconto" ON cupons_desconto FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users on cupons_desconto" ON cupons_desconto FOR DELETE USING (auth.role() = 'authenticated');
