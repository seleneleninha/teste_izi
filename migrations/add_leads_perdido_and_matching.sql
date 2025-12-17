-- Migration: Add "Perdido" status and structured lead fields
-- Execute this in Supabase SQL Editor

-- 1. Add new columns to leads table for structured interest
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS operacao_interesse UUID REFERENCES operacao(id),
ADD COLUMN IF NOT EXISTS tipo_imovel_interesse UUID REFERENCES tipo_imovel(id),
ADD COLUMN IF NOT EXISTS cidade_interesse TEXT,
ADD COLUMN IF NOT EXISTS bairro_interesse TEXT,
ADD COLUMN IF NOT EXISTS orcamento_min NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS orcamento_max NUMERIC DEFAULT 0;

-- 2. Update status check constraint to include 'Perdido'
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('Novo', 'Em Contato', 'Negociação', 'Fechado', 'Perdido'));

-- 3. Add motivo_perda column for tracking why leads were lost
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS motivo_perda TEXT,
ADD COLUMN IF NOT EXISTS data_perda TIMESTAMP;

-- 4. Create index for better query performance on new fields
CREATE INDEX IF NOT EXISTS idx_leads_operacao_interesse ON leads(operacao_interesse);
CREATE INDEX IF NOT EXISTS idx_leads_tipo_imovel_interesse ON leads(tipo_imovel_interesse);
CREATE INDEX IF NOT EXISTS idx_leads_cidade_interesse ON leads(cidade_interesse);
CREATE INDEX IF NOT EXISTS idx_leads_bairro_interesse ON leads(bairro_interesse);
CREATE INDEX IF NOT EXISTS idx_leads_orcamento_range ON leads(orcamento_min, orcamento_max);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 5. Create function to find matching properties for a lead
CREATE OR REPLACE FUNCTION find_matching_properties(lead_id UUID)
RETURNS TABLE (
    property_id UUID,
    match_score INTEGER,
    titulo TEXT,
    valor NUMERIC,
    cidade TEXT,
    bairro TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS property_id,
        (
            CASE WHEN a.operacao = (SELECT operacao_interesse FROM leads WHERE id = lead_id) THEN 30 ELSE 0 END +
            CASE WHEN a.tipo_imovel = (SELECT tipo_imovel_interesse FROM leads WHERE id = lead_id) THEN 30 ELSE 0 END +
            CASE WHEN a.cidade = (SELECT cidade_interesse FROM leads WHERE id = lead_id) THEN 20 ELSE 0 END +
            CASE WHEN a.bairro = (SELECT bairro_interesse FROM leads WHERE id = lead_id) THEN 10 ELSE 0 END +
            CASE 
                WHEN (a.valor_venda BETWEEN (SELECT orcamento_min FROM leads WHERE id = lead_id) AND (SELECT orcamento_max FROM leads WHERE id = lead_id))
                  OR (a.valor_locacao BETWEEN (SELECT orcamento_min FROM leads WHERE id = lead_id) AND (SELECT orcamento_max FROM leads WHERE id = lead_id))
                THEN 10 
                ELSE 0 
            END
        ) AS match_score,
        a.titulo,
        COALESCE(a.valor_venda, a.valor_locacao) AS valor,
        a.cidade,
        a.bairro
    FROM anuncios a
    WHERE a.status = 'ativo'
    AND (
        a.operacao = (SELECT operacao_interesse FROM leads WHERE id = lead_id)
        OR a.tipo_imovel = (SELECT tipo_imovel_interesse FROM leads WHERE id = lead_id)
        OR a.cidade = (SELECT cidade_interesse FROM leads WHERE id = lead_id)
    )
    ORDER BY match_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update ultima_interacao when lead status changes
CREATE OR REPLACE FUNCTION update_lead_interaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        NEW.ultima_interacao = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_interaction ON leads;
CREATE TRIGGER trigger_update_lead_interaction
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_interaction();

-- 7. Comments for documentation
COMMENT ON COLUMN leads.operacao_interesse IS 'Tipo de operação de interesse do lead (Venda, Locação)';
COMMENT ON COLUMN leads.tipo_imovel_interesse IS 'Tipo de imóvel de interesse do lead';
COMMENT ON COLUMN leads.cidade_interesse IS 'Cidade de interesse do lead';
COMMENT ON COLUMN leads.bairro_interesse IS 'Bairro de interesse do lead';
COMMENT ON COLUMN leads.orcamento_min IS 'Orçamento mínimo do lead';
COMMENT ON COLUMN leads.orcamento_max IS 'Orçamento máximo do lead';
COMMENT ON COLUMN leads.motivo_perda IS 'Motivo pelo qual o lead foi perdido';
COMMENT ON COLUMN leads.data_perda IS 'Data em que o lead foi marcado como perdido';
