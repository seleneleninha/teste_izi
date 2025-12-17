-- Fix notify_matching_leads function to remove references to deleted column subtipo_imovel_interesse

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
            
            -- Calculate simple match score
            IF NEW.operacao = matched_lead.operacao_interesse THEN match_score := match_score + 30; END IF;
            IF NEW.tipo_imovel = matched_lead.tipo_imovel_interesse THEN match_score := match_score + 20; END IF;
            -- Subtype check removed
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
