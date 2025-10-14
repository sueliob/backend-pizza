-- ==============================================
-- 🔍 DIAGNÓSTICO DE LOGIN (Execute no Neon SQL Editor)
-- ==============================================

-- 1. Verificar se pgcrypto está habilitado
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ pgcrypto HABILITADO'
    ELSE '❌ pgcrypto NÃO HABILITADO - Execute: CREATE EXTENSION IF NOT EXISTS pgcrypto;'
  END as status
FROM pg_extension 
WHERE extname = 'pgcrypto';

-- 2. Verificar se existe admin
SELECT 
  username,
  email,
  is_active,
  LEFT(password_hash, 30) || '...' as hash_preview,
  CASE 
    WHEN password_hash LIKE '$2a$%' THEN '✅ Hash pgcrypto válido ($2a$)'
    WHEN password_hash LIKE '$2b$%' THEN '⚠️ Hash bcryptjs ($2b$) - pode não funcionar com pgcrypto'
    ELSE '❌ Hash inválido'
  END as hash_type
FROM admin_users
WHERE username = 'admin';

-- 3. Testar login direto (mesma query do backend)
-- Senha: pizzaria123
SELECT 
  id, 
  username, 
  role,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ LOGIN VÁLIDO'
    ELSE '❌ LOGIN INVÁLIDO (usuário não existe ou senha errada)'
  END as resultado
FROM admin_users
WHERE username = 'admin'
  AND is_active = true
  AND password_hash = crypt('pizzaria123', password_hash)
GROUP BY id, username, role;

-- ==============================================
-- 📋 INTERPRETAÇÃO DOS RESULTADOS
-- ==============================================
-- 
-- Se query 1 retornar "❌ pgcrypto NÃO HABILITADO":
--   → Execute: CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- Se query 2 não retornar nada:
--   → Admin não existe, execute production-seed-pgcrypto.sql
--
-- Se query 2 retornar "❌ Hash inválido":
--   → Delete e recrie: DELETE FROM admin_users WHERE username='admin';
--   → Depois execute production-seed-pgcrypto.sql
--
-- Se query 3 retornar "❌ LOGIN INVÁLIDO":
--   → Hash incompatível, delete e recrie admin
--
-- Se query 3 retornar "✅ LOGIN VÁLIDO":
--   → Backend está correto, problema é no frontend/CORS
