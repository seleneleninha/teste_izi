-- =====================================================
-- STEP 2: Enable RLS and Drop Old Policies
-- =====================================================
-- Run this after Step 1 is successful

-- Enable RLS on all tables
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if they exist
DROP POLICY IF EXISTS "Enable all for authenticated users" ON perfis;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON anuncios;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON eventos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON transacoes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON documentos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON conversas;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON mensagens;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON notificacoes;
