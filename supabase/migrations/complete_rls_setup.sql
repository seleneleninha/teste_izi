-- =====================================================
-- COMPLETE RLS SETUP - ALL IN ONE
-- =====================================================
-- This script will:
-- 1. Add missing user_id columns
-- 2. Enable RLS
-- 3. Create all policies
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- PART 1: Add user_id columns to all tables
-- =====================================================

-- Add user_id to leads (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id to eventos (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE eventos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id to transacoes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transacoes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE transacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id to documentos (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE documentos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id to notificacoes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notificacoes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notificacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- PART 2: Enable RLS and Drop Old Policies
-- =====================================================

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON perfis;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON anuncios;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON eventos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON transacoes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON documentos;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON conversas;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON mensagens;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON notificacoes;

-- =====================================================
-- PART 3: Create RLS Policies
-- =====================================================

-- PERFIS
DROP POLICY IF EXISTS "Users can view own profile" ON perfis;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfis;
DROP POLICY IF EXISTS "Users can update own profile" ON perfis;
DROP POLICY IF EXISTS "Users can delete own profile" ON perfis;

CREATE POLICY "Users can view own profile" ON perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON perfis FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON perfis FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON perfis FOR DELETE USING (auth.uid() = id);

-- ANUNCIOS
DROP POLICY IF EXISTS "Users can view own properties" ON anuncios;
DROP POLICY IF EXISTS "Users can insert own properties" ON anuncios;
DROP POLICY IF EXISTS "Users can update own properties" ON anuncios;
DROP POLICY IF EXISTS "Users can delete own properties" ON anuncios;

CREATE POLICY "Users can view own properties" ON anuncios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON anuncios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON anuncios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON anuncios FOR DELETE USING (auth.uid() = user_id);

-- LEADS
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- EVENTOS
DROP POLICY IF EXISTS "Users can view own events" ON eventos;
DROP POLICY IF EXISTS "Users can insert own events" ON eventos;
DROP POLICY IF EXISTS "Users can update own events" ON eventos;
DROP POLICY IF EXISTS "Users can delete own events" ON eventos;

CREATE POLICY "Users can view own events" ON eventos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON eventos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON eventos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON eventos FOR DELETE USING (auth.uid() = user_id);

-- TRANSACOES
DROP POLICY IF EXISTS "Users can view own transactions" ON transacoes;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transacoes;
DROP POLICY IF EXISTS "Users can update own transactions" ON transacoes;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transacoes;

CREATE POLICY "Users can view own transactions" ON transacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transacoes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transacoes FOR DELETE USING (auth.uid() = user_id);

-- DOCUMENTOS
DROP POLICY IF EXISTS "Users can view own documents" ON documentos;
DROP POLICY IF EXISTS "Users can insert own documents" ON documentos;
DROP POLICY IF EXISTS "Users can update own documents" ON documentos;
DROP POLICY IF EXISTS "Users can delete own documents" ON documentos;

CREATE POLICY "Users can view own documents" ON documentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documentos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documentos FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICACOES
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notificacoes;

CREATE POLICY "Users can view own notifications" ON notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notificacoes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notificacoes FOR DELETE USING (auth.uid() = user_id);

-- CONVERSAS
DROP POLICY IF EXISTS "Users can view own conversations" ON conversas;
DROP POLICY IF EXISTS "Users can insert conversations they participate in" ON conversas;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversas;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversas;

CREATE POLICY "Users can view own conversations" ON conversas FOR SELECT 
  USING (participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));
CREATE POLICY "Users can insert conversations they participate in" ON conversas FOR INSERT 
  WITH CHECK (participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));
CREATE POLICY "Users can update own conversations" ON conversas FOR UPDATE 
  USING (participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)))
  WITH CHECK (participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));
CREATE POLICY "Users can delete own conversations" ON conversas FOR DELETE 
  USING (participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));

-- MENSAGENS
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON mensagens;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON mensagens;
DROP POLICY IF EXISTS "Users can update own messages" ON mensagens;
DROP POLICY IF EXISTS "Users can delete own messages" ON mensagens;

CREATE POLICY "Users can view messages in their conversations" ON mensagens FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );
CREATE POLICY "Users can insert messages in their conversations" ON mensagens FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
    AND auth.uid() = remetente_id
  );
CREATE POLICY "Users can update own messages" ON mensagens FOR UPDATE 
  USING (auth.uid() = remetente_id) WITH CHECK (auth.uid() = remetente_id);
CREATE POLICY "Users can delete own messages" ON mensagens FOR DELETE 
  USING (auth.uid() = remetente_id);

-- =====================================================
-- PART 4: Create Favorites Table
-- =====================================================

CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anuncio_id UUID REFERENCES anuncios(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anuncio_id)
);

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON favoritos;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favoritos;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favoritos;

CREATE POLICY "Users can view own favorites" ON favoritos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favoritos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favoritos FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PART 5: Storage Policies
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
