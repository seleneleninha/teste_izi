-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Para listar todas as triggers da tabela anuncios

SELECT 
  trigger_name,
  event_manipulation as evento,
  action_timing as quando,
  action_statement as codigo
FROM information_schema.triggers 
WHERE event_object_table = 'anuncios'
ORDER BY trigger_name;

-- =====================================================
-- Depois de identificar a trigger problemática, execute:
-- =====================================================

-- 1. Ver o código completo da trigger:
-- SELECT pg_get_triggerdef(oid) 
-- FROM pg_trigger 
-- WHERE tgname = 'nome_da_trigger';

-- 2. A trigger provavelmente tem algo como:
--    NEW.valor_condominio
-- 
--    Você precisa alterar para:
--    NEW.valor_condo

-- 3. Para dropar e recriar a trigger corrigida:
-- DROP TRIGGER nome_da_trigger ON anuncios;
-- 
-- CREATE TRIGGER nome_da_trigger
-- BEFORE INSERT OR UPDATE ON anuncios
-- FOR EACH ROW
-- EXECUTE FUNCTION sua_funcao();

-- =====================================================
-- IMPORTANTE: 
-- Copie o código da trigger, substitua valor_condominio
-- por valor_condo, e recrie a trigger.
-- =====================================================
