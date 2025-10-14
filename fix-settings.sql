-- Script para corrigir seções 'delivery' e 'address' no banco de dados
-- Execute este script no seu banco de dados Neon PostgreSQL

-- 1. Atualizar seção 'delivery' com estrutura correta
UPDATE pizzeria_settings 
SET 
  data = '{"baseFee": 5.00, "feePerRange": 2.50, "kmRange": 3, "baseTime": 45}'::jsonb,
  updated_at = NOW()
WHERE section = 'delivery';

-- 2. Inserir/Atualizar seção 'address'
INSERT INTO pizzeria_settings (id, section, data, created_at, updated_at)
VALUES (
  's0000000-0000-0000-0000-000000000007',
  'address',
  '{"street": "Rua das Pizzas", "number": "123", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "cep": "01234-567", "coordinates": {"lat": -23.5505, "lng": -46.6333}}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
  data = EXCLUDED.data, 
  updated_at = NOW();

-- 3. Verificar resultado
SELECT section, data FROM pizzeria_settings WHERE section IN ('delivery', 'address');
