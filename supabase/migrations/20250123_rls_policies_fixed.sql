-- =====================================================
-- STRICT ROW LEVEL SECURITY POLICIES (FIXED)
-- =====================================================
-- First, let's check which tables need user_id column added

-- Add user_id to tables that don't have it
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

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

-- =====================================================
-- PERFIS (Profiles)
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON perfis FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON perfis FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- ANUNCIOS (Properties)
-- =====================================================
CREATE POLICY "Users can view own properties"
  ON anuncios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON anuncios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON anuncios FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON anuncios FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- LEADS
-- =====================================================
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- EVENTOS (Calendar Events)
-- =====================================================
CREATE POLICY "Users can view own events"
  ON eventos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON eventos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON eventos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON eventos FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACOES (Financial Transactions)
-- =====================================================
CREATE POLICY "Users can view own transactions"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transacoes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DOCUMENTOS (Documents)
-- =====================================================
CREATE POLICY "Users can view own documents"
  ON documentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documentos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documentos FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CONVERSAS (Conversations)
-- =====================================================
-- Users can see conversations where they are a participant
CREATE POLICY "Users can view own conversations"
  ON conversas FOR SELECT
  USING (
    participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
  );

CREATE POLICY "Users can insert conversations they participate in"
  ON conversas FOR INSERT
  WITH CHECK (
    participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
  );

CREATE POLICY "Users can update own conversations"
  ON conversas FOR UPDATE
  USING (
    participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
  )
  WITH CHECK (
    participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
  );

CREATE POLICY "Users can delete own conversations"
  ON conversas FOR DELETE
  USING (
    participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
  );

-- =====================================================
-- MENSAGENS (Messages)
-- =====================================================
-- Users can see messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations"
  ON mensagens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON mensagens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.participantes::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
    AND auth.uid() = remetente_id
  );

CREATE POLICY "Users can update own messages"
  ON mensagens FOR UPDATE
  USING (auth.uid() = remetente_id)
  WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Users can delete own messages"
  ON mensagens FOR DELETE
  USING (auth.uid() = remetente_id);

-- =====================================================
-- NOTIFICACOES (Notifications)
-- =====================================================
CREATE POLICY "Users can view own notifications"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notificacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notificacoes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FAVORITOS (Favorites) - New Table
-- =====================================================
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anuncio_id UUID REFERENCES anuncios(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, anuncio_id)
);

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favoritos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favoritos FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE POLICIES (Avatar uploads)
-- =====================================================
-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
