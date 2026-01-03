-- Migration: Add AI Agent Configuration
-- Date: 2026-01-02
-- Description: Adds columns for AI agent customization (name, operation mode, away message)

-- Add new columns to whatsapp_config table
ALTER TABLE whatsapp_config
ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'IzA',
ADD COLUMN IF NOT EXISTS operation_mode TEXT DEFAULT '24h7' CHECK (operation_mode IN ('comercial', 'estendido', '24h7')),
ADD COLUMN IF NOT EXISTS away_message TEXT DEFAULT 'Olá! Sua mensagem é muito importante para nós, porém nosso expediente é de segunda à sexta das 08h às 18h.

📱 Deixe seu nome e interesse que retornaremos assim que possível!

Ou se preferir, acesse nosso portfólio: {LINK}';

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_config.agent_name IS 'Custom name for the AI agent (e.g., IzA, Marta, João IA)';
COMMENT ON COLUMN whatsapp_config.operation_mode IS 'comercial = Mon-Fri, estendido = Mon-Sat, 24h7 = Always online';
COMMENT ON COLUMN whatsapp_config.away_message IS 'Custom message sent when outside operation hours';
