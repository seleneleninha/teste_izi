-- Script simplificado para garantir que assigned_broker_id aceite NULL
-- NULL = encomenda veio da plataforma (PublicHome)
-- UUID = encomenda veio de página de corretor específico (BrokerPage)

-- 1. Verificar estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'encomendar_imovel' 
    AND column_name = 'assigned_broker_id';

-- 2. Garantir que a coluna é UUID e aceita NULL
ALTER TABLE encomendar_imovel 
ALTER COLUMN assigned_broker_id DROP NOT NULL;

-- 3. Adicionar comentário para documentação
COMMENT ON COLUMN encomendar_imovel.assigned_broker_id IS 
'ID do corretor (UUID) se encomenda veio de BrokerPage, ou NULL se veio de PublicHome/Plataforma';

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_encomendar_assigned_broker 
ON encomendar_imovel(assigned_broker_id);

-- 5. Verificar alteração
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'encomendar_imovel' 
    AND column_name = 'assigned_broker_id';

-- ============================================
-- 6. QUERIES ÚTEIS PARA CONSULTA
-- ============================================

-- Todas as encomendas com origem
SELECT 
    id,
    nome_cliente,
    whatsapp,
    tipo_imovel,
    cidade,
    assigned_broker_id,
    CASE 
        WHEN assigned_broker_id IS NULL THEN 'Plataforma'
        ELSE 'Corretor Específico'
    END as origem,
    created_at
FROM encomendar_imovel
ORDER BY created_at DESC;

-- Contar encomendas por origem
SELECT 
    CASE 
        WHEN assigned_broker_id IS NULL THEN 'Plataforma'
        ELSE 'Corretor'
    END as origem,
    COUNT(*) as total
FROM encomendar_imovel
GROUP BY origem;

-- Encomendas da plataforma (assigned_broker_id = NULL)
SELECT * FROM encomendar_imovel 
WHERE assigned_broker_id IS NULL
ORDER BY created_at DESC;

-- Encomendas de corretores específicos (com ID do corretor)
SELECT 
    e.*,
    p.nome as nome_corretor
FROM encomendar_imovel e
LEFT JOIN perfil_corretor p ON p.user_id = e.assigned_broker_id
WHERE e.assigned_broker_id IS NOT NULL
ORDER BY e.created_at DESC;

-- Ranking de corretores por encomendas capturadas
SELECT 
    p.nome as corretor,
    COUNT(e.id) as total_encomendas
FROM encomendar_imovel e
INNER JOIN perfil_corretor p ON p.user_id = e.assigned_broker_id
WHERE e.assigned_broker_id IS NOT NULL
GROUP BY p.nome
ORDER BY total_encomendas DESC;
