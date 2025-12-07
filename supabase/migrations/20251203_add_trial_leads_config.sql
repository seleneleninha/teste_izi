INSERT INTO admin_config (key, value, description)
VALUES ('trial_max_leads', '1', 'Número de leads detalhados visíveis para usuários em Trial')
ON CONFLICT (key) DO NOTHING;
