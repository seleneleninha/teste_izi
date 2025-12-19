-- =====================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Corrige a função validate_numeric_values
-- Substitui: valor_condominio -> valor_condo
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_numeric_values()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validar valores de venda/locação (não podem ser negativos)
    IF NEW.valor_venda IS NOT NULL AND NEW.valor_venda < 0 THEN
        RAISE EXCEPTION 'Valor de venda não pode ser negativo';
    END IF;
    IF NEW.valor_locacao IS NOT NULL AND NEW.valor_locacao < 0 THEN
        RAISE EXCEPTION 'Valor de locação não pode ser negativo';
    END IF;
    IF NEW.valor_diaria IS NOT NULL AND NEW.valor_diaria < 0 THEN
        RAISE EXCEPTION 'Valor de diária não pode ser negativo';
    END IF;
    -- CORRIGIDO: valor_condominio -> valor_condo
    IF NEW.valor_condo IS NOT NULL AND NEW.valor_condo < 0 THEN
        RAISE EXCEPTION 'Valor de condomínio não pode ser negativo';
    END IF;
    -- CORRIGIDO: iptu -> valor_iptu
    IF NEW.valor_iptu IS NOT NULL AND NEW.valor_iptu < 0 THEN
        RAISE EXCEPTION 'Valor de IPTU não pode ser negativo';
    END IF;
    -- Validar áreas (devem ser positivas se fornecidas)
    IF NEW.area_priv IS NOT NULL AND NEW.area_priv <= 0 THEN
        RAISE EXCEPTION 'Área privativa deve ser maior que zero';
    END IF;
    IF NEW.area_total IS NOT NULL AND NEW.area_total <= 0 THEN
        RAISE EXCEPTION 'Área total deve ser maior que zero';
    END IF;
    -- Validar quantidades (não podem ser negativas)
    IF NEW.quartos IS NOT NULL AND NEW.quartos < 0 THEN
        RAISE EXCEPTION 'Número de quartos não pode ser negativo';
    END IF;
    IF NEW.banheiros IS NOT NULL AND NEW.banheiros < 0 THEN
        RAISE EXCEPTION 'Número de banheiros não pode ser negativo';
    END IF;
    IF NEW.vagas IS NOT NULL AND NEW.vagas < 0 THEN
        RAISE EXCEPTION 'Número de vagas não pode ser negativo';
    END IF;
    RETURN NEW;
END;
$function$;

-- =====================================================
-- APÓS EXECUTAR, TESTE O CADASTRO DE IMÓVEL
-- O erro "valor_condominio" deve desaparecer!
-- =====================================================
