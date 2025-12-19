-- Script SQL para consultar e modificar a tabela encomendar_imovel
-- Autor: Sistema iziBrokerz
-- Data: 2025-12-18

-- ============================================
-- 1. CONSULTAR ESTRUTURA ATUAL DA TABELA
-- ============================================

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'encomendar_imovel'
ORDER BY 
    ordinal_position;

-- ============================================
-- 2. CONSULTAR TODOS OS DADOS
-- ============================================

SELECT * FROM encomendar_imovel 
ORDER BY created_at DESC;

-- ============================================
-- 3. ADICIONAR NOVAS COLUNAS (se não existirem)
-- ============================================

-- Remover coluna email (se existir)
ALTER TABLE encomendar_imovel 
DROP COLUMN IF EXISTS email;

-- Adicionar coluna metragem
ALTER TABLE encomendar_imovel 
ADD COLUMN IF NOT EXISTS metragem INTEGER;

-- Adicionar coluna quartos
ALTER TABLE encomendar_imovel 
ADD COLUMN IF NOT EXISTS quartos INTEGER;

-- Adicionar coluna banheiros
ALTER TABLE encomendar_imovel 
ADD COLUMN IF NOT EXISTS banheiros INTEGER;

-- Adicionar coluna vagas
ALTER TABLE encomendar_imovel 
ADD COLUMN IF NOT EXISTS vagas INTEGER;

-- Tornar whatsapp opcional (nullable)
ALTER TABLE encomendar_imovel 
ALTER COLUMN whatsapp DROP NOT NULL;

-- ============================================
-- 4. VERIFICAR ESTRUTURA ATUALIZADA
-- ============================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'encomendar_imovel'
ORDER BY 
    ordinal_position;

-- ============================================
-- 5. CONSULTAS ÚTEIS PARA ADMINISTRAÇÃO
-- ============================================

-- Contar total de encomendas
SELECT COUNT(*) as total_encomendas 
FROM encomendar_imovel;

-- Encomendas por operação
SELECT 
    operacao,
    COUNT(*) as total
FROM encomendar_imovel
GROUP BY operacao
ORDER BY total DESC;

-- Encomendas por tipo de imóvel
SELECT 
    tipo_imovel,
    COUNT(*) as total
FROM encomendar_imovel
GROUP BY tipo_imovel
ORDER BY total DESC;

-- Encomendas por cidade
SELECT 
    cidade,
    COUNT(*) as total
FROM encomendar_imovel
GROUP BY cidade
ORDER BY total DESC;

-- Encomendas pendentes
SELECT * FROM encomendar_imovel 
WHERE status = 'pendente'
ORDER BY created_at DESC;

-- Encomendas dos últimos 7 dias
SELECT * FROM encomendar_imovel 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Faixa de preços mais procurada
SELECT 
    CASE 
        WHEN preco_maximo <= 200000 THEN 'Até R$200mil'
        WHEN preco_maximo <= 500000 THEN 'R$200mil - R$500mil'
        WHEN preco_maximo <= 1000000 THEN 'R$500mil - R$1M'
        WHEN preco_maximo <= 2000000 THEN 'R$1M - R$2M'
        ELSE 'Acima de R$2M'
    END as faixa_preco,
    COUNT(*) as total
FROM encomendar_imovel
GROUP BY faixa_preco
ORDER BY total DESC;

-- Encomendas com características específicas
SELECT 
    nome_cliente,
    whatsapp,
    tipo_imovel,
    cidade,
    metragem,
    quartos,
    banheiros,
    vagas,
    preco_minimo,
    preco_maximo
FROM encomendar_imovel
WHERE 
    (quartos IS NOT NULL AND quartos > 0)
    OR (banheiros IS NOT NULL AND banheiros > 0)
    OR (vagas IS NOT NULL AND vagas > 0)
    OR (metragem IS NOT NULL AND metragem > 0)
ORDER BY created_at DESC;

-- ============================================
-- 6. SCRIPT DE MIGRAÇÃO COMPLETO (BACKUP)
-- ============================================

-- Caso precise recriar a tabela completamente
/*
DROP TABLE IF EXISTS encomendar_imovel;

CREATE TABLE encomendar_imovel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_cliente VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    operacao VARCHAR(50) NOT NULL,
    tipo_imovel VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    bairros_interesse TEXT[] NOT NULL,
    preco_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
    preco_maximo DECIMAL(12,2) NOT NULL,
    metragem INTEGER,
    quartos INTEGER,
    banheiros INTEGER,
    vagas INTEGER,
    observacoes TEXT,
    conversation_id UUID,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_encomendar_status ON encomendar_imovel(status);
CREATE INDEX idx_encomendar_cidade ON encomendar_imovel(cidade);
CREATE INDEX idx_encomendar_operacao ON encomendar_imovel(operacao);
CREATE INDEX idx_encomendar_created ON encomendar_imovel(created_at DESC);
*/

-- ============================================
-- 7. COMENTÁRIOS NAS COLUNAS
-- ============================================

COMMENT ON COLUMN encomendar_imovel.metragem IS 'Área desejada em metros quadrados';
COMMENT ON COLUMN encomendar_imovel.quartos IS 'Número de quartos desejados';
COMMENT ON COLUMN encomendar_imovel.banheiros IS 'Número de banheiros desejados';
COMMENT ON COLUMN encomendar_imovel.vagas IS 'Número de vagas de garagem desejadas';
COMMENT ON COLUMN encomendar_imovel.whatsapp IS 'WhatsApp do cliente (opcional)';
