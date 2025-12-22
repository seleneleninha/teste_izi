-- Migration: Update lead matching function with new point system and fix status column
-- Execute this in Supabase SQL Editor

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
  -- Get lead details
  SELECT * INTO v_lead FROM leads WHERE id = lead_id;

  -- Get IDs for operations
  SELECT id INTO v_op_locacao FROM operacao WHERE tipo = 'Locação';
  SELECT id INTO v_op_venda FROM operacao WHERE tipo = 'Venda';
  SELECT id INTO v_op_venda_locacao FROM operacao WHERE tipo = 'Venda/Locação';

  RETURN QUERY
  SELECT
    a.id,
    a.titulo,
    -- Handle value based on operation
    COALESCE(a.valor_venda, a.valor_locacao, a.valor_diaria, a.valor_mensal, 0) as valor,
    a.cidade,
    a.bairro,
    (SELECT url FROM imovel_fotos WHERE imovel_id = a.id LIMIT 1) as imagem,
    -- Calculate Score (0-100)
    (
      -- 1. Tipo de Imóvel (20 points)
      (CASE WHEN a.tipo_imovel = v_lead.tipo_imovel_interesse THEN 20 ELSE 0 END) +
      
      -- 2. Operação (20 points)
      (CASE WHEN a.operacao = v_lead.operacao_interesse THEN 20 ELSE 0 END) +
      
      -- 3. Cidade (20 points)
      (CASE WHEN a.cidade = v_lead.cidade_interesse THEN 20 ELSE 0 END) +
      
      -- 4. Bairros (Max 10 points)
      (CASE 
        WHEN a.bairro = v_lead.bairro_interesse THEN 10
        WHEN a.bairro = v_lead.bairro_interesse_2 THEN 5
        WHEN a.bairro = v_lead.bairro_interesse_3 THEN 5
        ELSE 0 
      END) +
      
      -- 5. Orçamento (20 points)
      (CASE 
        WHEN v_lead.orcamento_min > 0 AND v_lead.orcamento_max > 0 AND 
             COALESCE(a.valor_venda, a.valor_locacao, a.valor_diaria, a.valor_mensal, 0) BETWEEN v_lead.orcamento_min AND v_lead.orcamento_max 
        THEN 20 
        ELSE 0 
      END)
    )::INTEGER as match_score
  FROM anuncios a
  WHERE
    -- Ensure we only match active properties
    a.status = 'ativo'
    AND
    -- Filter logic (Broaden to find relevant suggestions)
    (
      -- Match operation (including hybrid)
      (v_lead.operacao_interesse IS NULL OR
       (v_lead.operacao_interesse = v_op_locacao AND a.operacao IN (v_op_locacao, v_op_venda_locacao)) OR
       (v_lead.operacao_interesse = v_op_venda AND a.operacao IN (v_op_venda, v_op_venda_locacao)) OR
       (a.operacao = v_lead.operacao_interesse))
      AND
      -- Match city if specified
      (v_lead.cidade_interesse IS NULL OR v_lead.cidade_interesse = '' OR a.cidade = v_lead.cidade_interesse)
      AND
      -- Match type if specified
      (v_lead.tipo_imovel_interesse IS NULL OR a.tipo_imovel = v_lead.tipo_imovel_interesse)
    )
  ORDER BY
    match_score DESC,
    a.created_at DESC
  LIMIT 15;
END;
$$ LANGUAGE plpgsql;
