-- =====================================================
-- STEP 3: Create RLS Policies for Core Tables
-- =====================================================
-- Run this after Step 2 is successful

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
