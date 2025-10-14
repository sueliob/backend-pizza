-- 🔍 Verificar e Preparar pgcrypto para Login

-- 1️⃣ Verificar se pgcrypto está instalado
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pgcrypto';
-- Se retornar vazio, execute: CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2️⃣ Verificar formato do password_hash do admin
SELECT 
  username,
  LEFT(password_hash, 7) as hash_format,
  LENGTH(password_hash) as hash_length,
  is_active
FROM admin_users 
WHERE username = 'admin';
-- ✅ Esperado: hash_format = '$2a$10$' ou '$2b$10$', length = 60

-- 3️⃣ Testar crypt() com senha conhecida
-- Se o admin foi criado com bcryptjs, o hash deve ser compatível
SELECT 
  username,
  (password_hash = crypt('pizzaria123', password_hash)) as senha_correta
FROM admin_users 
WHERE username = 'admin';
-- ✅ Esperado: senha_correta = true

-- 4️⃣ Se o hash não for compatível, recriar o admin com pgcrypto
-- DELETE FROM admin_users WHERE username = 'admin';
-- INSERT INTO admin_users (id, username, email, password_hash, role, is_active)
-- VALUES (
--   gen_random_uuid(),
--   'admin',
--   'admin@pizzaria.com',
--   crypt('pizzaria123', gen_salt('bf', 10)),
--   'admin',
--   true
-- );
