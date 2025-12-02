-- Add missing columns to leads table

ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anotacoes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update the trigger function to ensure it works correctly
CREATE OR REPLACE FUNCTION update_lead_interaction()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_interacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
