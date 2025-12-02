
-- 1. Update Status Constraint to include 'Inativo'
-- PostgreSQL doesn't support altering a check constraint directly easily.
-- We drop the old one and add a new one.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status = ANY (ARRAY['Novo'::text, 'Em Contato'::text, 'Negociação'::text, 'Fechado'::text, 'Perdido'::text, 'Inativo'::text]));

-- 3. Update find_matching_properties function (remove subtype logic)
DROP FUNCTION IF EXISTS find_matching_properties(uuid);

CREATE OR REPLACE FUNCTION find_matching_properties(lead_id UUID)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  valor NUMERIC,
  cidade TEXT,
  bairro TEXT,
  imagem TEXT,
  match_score INTEGER
) AS $$
DECLARE
  v_lead leads%ROWTYPE;
  v_op_locacao UUID;
  v_op_venda UUID;
  v_op_venda_locacao UUID;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = lead_id;

  -- Get IDs for operations
  SELECT id INTO v_op_locacao FROM operacao WHERE tipo = 'Locação';
  SELECT id INTO v_op_venda FROM operacao WHERE tipo = 'Venda';
  SELECT id INTO v_op_venda_locacao FROM operacao WHERE tipo = 'Venda/Locação';

  RETURN QUERY
  SELECT
    a.id,
    a.titulo,
    a.valor,
    a.cidade,
    a.bairro,
    (SELECT url FROM imovel_fotos WHERE imovel_id = a.id LIMIT 1) as imagem,
    -- Calculate Score (0-100)
    (
      (CASE WHEN a.operacao = v_lead.operacao_interesse THEN 30 ELSE 0 END) +
      (CASE WHEN a.tipo_imovel = v_lead.tipo_imovel_interesse THEN 40 ELSE 0 END) + -- Increased weight for Type
      (CASE WHEN a.cidade = v_lead.cidade_interesse THEN 20 ELSE 0 END) +
      (CASE WHEN a.bairro = v_lead.bairro_interesse THEN 10 ELSE 0 END)
    )::INTEGER as match_score
  FROM anuncios a
  WHERE
    -- 1. Operation Logic
    (
      v_lead.operacao_interesse IS NULL OR
      (v_lead.operacao_interesse = v_op_locacao AND a.operacao IN (v_op_locacao, v_op_venda_locacao)) OR
      (v_lead.operacao_interesse = v_op_venda AND a.operacao IN (v_op_venda, v_op_venda_locacao)) OR
      (a.operacao = v_lead.operacao_interesse)
    )
    AND
    -- 2. Type Logic (Subtype removed)
    (v_lead.tipo_imovel_interesse IS NULL OR a.tipo_imovel = v_lead.tipo_imovel_interesse)
    AND
    -- 3. Budget Logic
    (
       (v_lead.orcamento_min IS NULL OR v_lead.orcamento_min = 0 OR a.valor >= v_lead.orcamento_min) AND
       (v_lead.orcamento_max IS NULL OR v_lead.orcamento_max = 0 OR a.valor <= v_lead.orcamento_max)
    )
    AND
    -- 4. Location Logic
    (
        v_lead.cidade_interesse IS NULL OR 
        v_lead.cidade_interesse = '' OR
        a.cidade = v_lead.cidade_interesse
    )
  ORDER BY
    match_score DESC;
END;
$$ LANGUAGE plpgsql;
