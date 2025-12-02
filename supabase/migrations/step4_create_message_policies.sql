-- =====================================================
-- STEP 4: Create RLS Policies for Messages
-- =====================================================
-- Run this after Step 3 is successful

-- =====================================================
-- CONVERSAS (Conversations)
-- =====================================================
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
