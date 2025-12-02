-- =====================================================
-- STEP 1 (REVISED): Add user_id to ALL tables that need it
-- =====================================================
-- Run this to ensure ALL tables have user_id column

-- Add user_id to leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to eventos
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to transacoes
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to documentos
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to notificacoes
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify anuncios already has user_id (it should)
-- If not, uncomment:
-- ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
