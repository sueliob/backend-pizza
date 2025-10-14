-- 🔐 Habilitar pgcrypto no Neon Postgres
-- Execute este script no Neon SQL Editor antes de usar auth-pgcrypto

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificar se está instalado
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

-- Testar funções (deve retornar hash)
SELECT crypt('teste', gen_salt('bf', 10)) as test_hash;
