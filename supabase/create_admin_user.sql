-- INSTRUÇÕES PARA CRIAR USUÁRIO ADMIN
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, crie o usuário admin via Supabase Dashboard:
--    Authentication > Users > Add User
--    Email: admin@izibrokerz.com
--    Password: 123456
--    Auto Confirm User: YES

-- 2. Depois, execute este SQL para torná-lo admin:
UPDATE public.perfis 
SET is_admin = true, 
    cargo = 'Administrador'
WHERE email = 'admin@izibrokerz.com';

-- 3. Verifique se funcionou:
SELECT id, nome, email, is_admin, cargo
FROM perfis
WHERE email = 'admin@izibrokerz.com';
