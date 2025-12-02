-- Migration: Add priority and tracking fields to leads table
-- Execute this in Supabase SQL Editor

-- Add new columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site',
ADD COLUMN IF NOT EXISTS ultima_interacao TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS anotacoes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_prioridade ON leads(prioridade);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_ultima_interacao ON leads(ultima_interacao DESC);

-- Update existing leads to have default values
UPDATE leads SET 
    prioridade = 'media',
    origem = 'site',
    ultima_interacao = COALESCE(ultima_interacao, data_criacao)
WHERE prioridade IS NULL OR origem IS NULL OR ultima_interacao IS NULL;
