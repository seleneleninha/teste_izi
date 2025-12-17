-- Migration: Add subtype to leads, create notifications table, and alert trigger
-- Execute this in Supabase SQL Editor


-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- The broker to notify (optional, if null notify all or based on lead ownership)
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    link TEXT, -- Link to the property or lead
    tipo TEXT DEFAULT 'alerta_imovel', -- 'alerta_imovel', 'novo_lead', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- 3. Update find_matching_properties function to include subtype
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
            CASE WHEN a.tipo_imovel = (SELECT tipo_imovel_interesse FROM leads WHERE id = lead_id) THEN 20 ELSE 0 END + -- Reduced from 30 to 20 to give space for subtype
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

-- 4. Create Trigger Function to Notify Brokers when a new property matches a lead
CREATE OR REPLACE FUNCTION notify_matching_leads()
RETURNS TRIGGER AS $$
DECLARE
    matched_lead RECORD;
    match_score INTEGER;
BEGIN
    -- Only run for approved properties
    IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') THEN
        
        -- Iterate through leads that might match
        FOR matched_lead IN 
            SELECT id, nome, operacao_interesse, tipo_imovel_interesse, cidade_interesse, bairro_interesse, orcamento_min, orcamento_max
            FROM leads 
            WHERE status NOT IN ('Fechado', 'Perdido') -- Only active leads
        LOOP
            match_score := 0;
            
            -- Calculate simple match score (logic duplicated from find_matching_properties for simplicity in trigger)
            IF NEW.operacao = matched_lead.operacao_interesse THEN match_score := match_score + 30; END IF;
            IF NEW.tipo_imovel = matched_lead.tipo_imovel_interesse THEN match_score := match_score + 20; END IF;
            IF NEW.cidade = matched_lead.cidade_interesse THEN match_score := match_score + 20; END IF;
            IF NEW.bairro = matched_lead.bairro_interesse THEN match_score := match_score + 10; END IF;
            
            -- Price check
            IF (NEW.valor_venda BETWEEN matched_lead.orcamento_min AND matched_lead.orcamento_max) 
               OR (NEW.valor_locacao BETWEEN matched_lead.orcamento_min AND matched_lead.orcamento_max) THEN
               match_score := match_score + 10;
            END IF;

            -- If match score is high enough (e.g., > 60), create notification
            IF match_score >= 60 THEN
                INSERT INTO notificacoes (titulo, mensagem, link, tipo)
                VALUES (
                    'Novo Imóvel Compatível!',
                    'O imóvel "' || NEW.titulo || '" combina com o lead ' || matched_lead.nome || ' (' || match_score || '% match).',
                    '/imoveis/' || NEW.id,
                    'alerta_imovel'
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Trigger to anuncios table
DROP TRIGGER IF EXISTS trigger_notify_matching_leads ON anuncios;
CREATE TRIGGER trigger_notify_matching_leads
    AFTER INSERT OR UPDATE ON anuncios
    FOR EACH ROW
    EXECUTE FUNCTION notify_matching_leads();

-- 6. Comments
COMMENT ON TABLE notificacoes IS 'System notifications for users';
