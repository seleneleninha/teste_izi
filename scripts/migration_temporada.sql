-- ===========================================
-- MIGRATION: Temporada Feature
-- Execute no Supabase Dashboard > SQL Editor
-- ===========================================

-- 1. Adicionar colunas de preço para Temporada na tabela anuncios
ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(12,2);

-- 2. Tornar subtipo_imovel opcional (para Temporada não usar subtipo)
ALTER TABLE anuncios 
ALTER COLUMN subtipo_imovel DROP NOT NULL;

-- 3. Adicionar flag para tipos disponíveis em Temporada
ALTER TABLE tipo_imovel 
ADD COLUMN IF NOT EXISTS disponivel_temporada BOOLEAN DEFAULT false;

-- 4. Marcar tipos disponíveis para temporada
UPDATE tipo_imovel SET disponivel_temporada = true 
WHERE tipo ILIKE '%Apartamento%' 
   OR tipo ILIKE '%Casa%' 
   OR tipo ILIKE '%Chácara%'
   OR tipo ILIKE '%Kitnet%'
   OR tipo ILIKE '%Studio%'
   OR tipo ILIKE '%Sobrado%'
   OR tipo ILIKE '%Cobertura%';

-- 5. Adicionar novos tipos se não existirem (opcional)
INSERT INTO tipo_imovel (tipo, disponivel_temporada) 
VALUES 
  ('Chalé', true),
  ('Sítio', true)
ON CONFLICT (tipo) DO UPDATE SET disponivel_temporada = true;

-- 6. Verificar resultado
SELECT id, tipo, disponivel_temporada FROM tipo_imovel ORDER BY tipo;
