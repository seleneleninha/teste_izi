-- Create planos table
CREATE TABLE IF NOT EXISTS planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  limite_anuncios INTEGER NOT NULL,
  limite_parcerias INTEGER NOT NULL,
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_anual DECIMAL(10,2) NOT NULL,
  destaque BOOLEAN DEFAULT false,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create cupons_desconto table
CREATE TABLE IF NOT EXISTS cupons_desconto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  desconto_percentual INTEGER NOT NULL,
  valido_ate TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons_desconto ENABLE ROW LEVEL SECURITY;

-- Policies (Public read access)
CREATE POLICY "Public read access for planos" ON planos FOR SELECT USING (true);
CREATE POLICY "Public read access for cupons_desconto" ON cupons_desconto FOR SELECT USING (true);

-- Insert default plans
INSERT INTO planos (nome, limite_anuncios, limite_parcerias, preco_mensal, preco_anual, destaque, features) VALUES
('Básico', 10, 10, 99.90, 959.04, false, ARRAY['Até 10 Anúncios', 'Até 10 Parcerias', 'Painel de Controle Básico', 'Suporte por Email']),
('Intermediário', 25, 20, 199.90, 1919.04, false, ARRAY['Até 25 Anúncios', 'Até 20 Parcerias', 'Painel de Controle Completo', 'Suporte Prioritário', 'Estatísticas de Visualização']),
('Avançado', 50, 30, 299.90, 2879.04, true, ARRAY['Até 50 Anúncios', 'Até 30 Parcerias', 'Destaque nos Resultados', 'Suporte via WhatsApp', 'Relatórios Avançados', 'Selo de Corretor Verificado']),
('Profissional', 100, 50, 499.90, 4799.04, false, ARRAY['Até 100 Anúncios', 'Até 50 Parcerias', 'Prioridade Máxima em Buscas', 'Gerente de Conta Dedicado', 'API de Integração', 'Importação XML (Em breve)']);
