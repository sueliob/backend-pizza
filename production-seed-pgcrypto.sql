-- ==============================================
-- 🚀 PRODUCTION SEED - VERSÃO OTIMIZADA (pgcrypto)
-- ==============================================
-- Este script usa pgcrypto para gerar hashes de senha no Postgres
-- ✅ Mais rápido (sem CPU no Worker)
-- ✅ Mais seguro (hash gerado no banco)
-- ✅ Pode rodar múltiplas vezes (ON CONFLICT DO NOTHING)

-- ==============================================
-- 0. HABILITAR PGCRYPTO (executar UMA VEZ)
-- ==============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================
-- 1. SABORES DE PIZZA (20 sabores)
-- ==============================================

INSERT INTO pizza_flavors (id, name, description, prices, category, image_url, available) VALUES
-- Salgadas (10)
('a0000000-0000-0000-0000-000000000001', 'Margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite', '{"grande": "35.00", "individual": "25.00"}', 'salgadas', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002', true),
('a0000000-0000-0000-0000-000000000002', 'Calabresa', 'Calabresa fatiada, cebola, mussarela e azeitonas', '{"grande": "38.00", "individual": "28.00"}', 'salgadas', 'https://images.unsplash.com/photo-1628840042765-356cda07504e', true),
('a0000000-0000-0000-0000-000000000003', 'Portuguesa', 'Presunto, ovos, cebola, azeitonas, mussarela e ervilha', '{"grande": "42.00", "individual": "30.00"}', 'salgadas', 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94', true),
('a0000000-0000-0000-0000-000000000004', 'Quatro Queijos', 'Mussarela, gorgonzola, parmesão e provolone', '{"grande": "45.00", "individual": "32.00"}', 'salgadas', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f', true),
('a0000000-0000-0000-0000-000000000005', 'Frango Catupiry', 'Frango desfiado com catupiry, mussarela e milho', '{"grande": "40.00", "individual": "29.00"}', 'salgadas', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', true),
('a0000000-0000-0000-0000-000000000006', 'Bacon', 'Bacon crocante, mussarela, cebola e azeitonas', '{"grande": "43.00", "individual": "31.00"}', 'salgadas', 'https://images.unsplash.com/photo-1628840042765-356cda07504e', true),
('a0000000-0000-0000-0000-000000000007', 'Toscana', 'Calabresa moída, alho frito, parmesão e mussarela', '{"grande": "41.00", "individual": "30.00"}', 'salgadas', 'https://images.unsplash.com/photo-1513104890138-7c749659a591', true),
('a0000000-0000-0000-0000-000000000008', 'Vegetariana', 'Brócolis, champignon, palmito, tomate e mussarela', '{"grande": "39.00", "individual": "28.00"}', 'salgadas', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f', true),
('a0000000-0000-0000-0000-000000000009', 'Atum', 'Atum, cebola, azeitonas, mussarela e orégano', '{"grande": "44.00", "individual": "32.00"}', 'salgadas', 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e', true),
('a0000000-0000-0000-0000-000000000010', 'Pepperoni', 'Pepperoni, mussarela, orégano e molho especial', '{"grande": "46.00", "individual": "33.00"}', 'salgadas', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee', true),

-- Doces (6)
('b0000000-0000-0000-0000-000000000001', 'Chocolate', 'Chocolate ao leite e granulado', '{"media": "32.00", "individual": "20.00"}', 'doces', 'https://images.unsplash.com/photo-1549903072-7e6e0bedb501', true),
('b0000000-0000-0000-0000-000000000002', 'Romeu e Julieta', 'Queijo e goiabada derretida', '{"media": "34.00", "individual": "22.00"}', 'doces', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', true),
('b0000000-0000-0000-0000-000000000003', 'Prestígio', 'Chocolate e coco ralado', '{"media": "35.00", "individual": "23.00"}', 'doces', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', true),
('b0000000-0000-0000-0000-000000000004', 'Banana com Canela', 'Banana fatiada, canela e açúcar', '{"media": "30.00", "individual": "19.00"}', 'doces', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d', true),
('b0000000-0000-0000-0000-000000000005', 'M&Ms', 'Chocolate branco e M&Ms coloridos', '{"media": "36.00", "individual": "24.00"}', 'doces', 'https://images.unsplash.com/photo-1549903072-7e6e0bedb501', true),
('b0000000-0000-0000-0000-000000000006', 'Nutella com Morango', 'Nutella cremosa com morangos frescos', '{"media": "42.00", "individual": "28.00"}', 'doces', 'https://images.unsplash.com/photo-1549903072-7e6e0bedb501', true),

-- Entradas (2)
('c0000000-0000-0000-0000-000000000001', 'Bruschetta', 'Pão italiano com tomate, manjericão e azeite', '{"unico": "18.00"}', 'entradas', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f', true),
('c0000000-0000-0000-0000-000000000002', 'Palitos de Alho', 'Palitos de massa com queijo e molho de alho', '{"unico": "22.00"}', 'entradas', 'https://images.unsplash.com/photo-1619221882018-aa9f0e0c6dd9', true),

-- Bebidas (2)
('d0000000-0000-0000-0000-000000000001', 'Refrigerante 2L', 'Coca-Cola, Guaraná ou Fanta', '{"unico": "12.00"}', 'bebidas', 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a', true),
('d0000000-0000-0000-0000-000000000002', 'Suco Natural 1L', 'Laranja, limão ou abacaxi', '{"unico": "15.00"}', 'bebidas', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. EXTRAS (18 itens)
-- ==============================================

INSERT INTO extras (id, name, description, price, category, available) VALUES
('e0000000-0000-0000-0000-000000000001', 'Borda Recheada Catupiry', 'Borda recheada com catupiry cremoso', '8.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000002', 'Borda Recheada Cheddar', 'Borda recheada com cheddar', '8.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000003', 'Borda Recheada Chocolate', 'Borda recheada com chocolate', '9.00', 'doces', true),
('e0000000-0000-0000-0000-000000000004', 'Extra Bacon', 'Bacon crocante extra', '6.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000005', 'Extra Calabresa', 'Calabresa fatiada extra', '5.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000006', 'Extra Frango', 'Frango desfiado extra', '5.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000007', 'Extra Mussarela', 'Mussarela extra', '4.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000008', 'Extra Catupiry', 'Catupiry cremoso extra', '6.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000009', 'Extra Cheddar', 'Cheddar extra', '5.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000010', 'Extra Azeitonas', 'Azeitonas pretas extra', '3.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000011', 'Extra Champignon', 'Champignon fresco extra', '6.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000012', 'Extra Palmito', 'Palmito extra', '7.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000013', 'Extra Brócolis', 'Brócolis fresco extra', '4.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000014', 'Extra Milho', 'Milho verde extra', '3.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000015', 'Extra Atum', 'Atum extra', '8.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000016', 'Extra Pepperoni', 'Pepperoni extra', '7.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000017', 'Extra Orégano', 'Orégano extra', '1.00', 'salgadas', true),
('e0000000-0000-0000-0000-000000000018', 'Embalagem Especial', 'Embalagem premium', '2.00', 'salgadas', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 3. TIPOS DE MASSA (7 opções)
-- ==============================================

INSERT INTO dough_types (id, name, description, price, category, available) VALUES
('f0000000-0000-0000-0000-000000000001', 'Tradicional', 'Massa tradicional fofinha e crocante', '0.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000002', 'Fina', 'Massa fina e crocante estilo italiana', '2.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000003', 'Pan', 'Massa alta e fofinha estilo pan', '3.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000004', 'Integral', 'Massa integral saudável', '4.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000005', 'Sem Glúten', 'Massa especial sem glúten', '8.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000006', 'Recheada', 'Massa recheada com catupiry', '6.00', 'salgadas', true),
('f0000000-0000-0000-0000-000000000007', 'Fermentação Natural', 'Massa com 48h de fermentação', '5.00', 'salgadas', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 4. CONFIGURAÇÕES DA PIZZARIA (6 settings)
-- ==============================================

INSERT INTO pizzeria_settings (id, section, data) VALUES
('s0000000-0000-0000-0000-000000000001', 'branding', '{
  "name": "Pizzaria Bella Massa",
  "logo": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200",
  "backgroundUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591",
  "primaryColor": "#DC2626",
  "secondaryColor": "#FEF3C7"
}'),
('s0000000-0000-0000-0000-000000000002', 'contact', '{
  "phone": "(11) 98765-4321",
  "whatsapp": "5511987654321",
  "email": "contato@bellamassa.com.br",
  "instagram": "@bellamassa",
  "facebook": "bellamassapizzaria"
}'),
('s0000000-0000-0000-0000-000000000003', 'business_hours', '{
  "Segunda-feira": "Fechado",
  "Terça-feira": "18:00 - 23:00",
  "Quarta-feira": "18:00 - 23:00",
  "Quinta-feira": "18:00 - 23:00",
  "Sexta-feira": "18:00 - 00:00",
  "Sábado": "18:00 - 00:00",
  "Domingo": "18:00 - 23:00"
}'),
('s0000000-0000-0000-0000-000000000004', 'delivery', '{
  "baseFee": 5.00,
  "feePerRange": 2.50,
  "kmRange": 3,
  "baseTime": 45
}'),
('s0000000-0000-0000-0000-000000000007', 'address', '{
  "street": "Rua das Pizzas",
  "number": "123",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "cep": "01234-567",
  "coordinates": {
    "lat": -23.5505,
    "lng": -46.6333
  }
}'),
('s0000000-0000-0000-0000-000000000005', 'payment_methods', '{
  "cash": true,
  "credit_card": true,
  "debit_card": true,
  "pix": true
}'),
('s0000000-0000-0000-0000-000000000006', 'categories', '{
  "salgadas": {
    "name": "Pizzas Salgadas",
    "description": "Nossas deliciosas pizzas salgadas tradicionais",
    "icon": "pizza",
    "order": 1
  },
  "doces": {
    "name": "Pizzas Doces",
    "description": "Pizzas doces irresistíveis para sobremesa",
    "icon": "candy",
    "order": 2
  },
  "entradas": {
    "name": "Entradas",
    "description": "Aperitivos deliciosos para começar bem sua refeição",
    "icon": "appetizer",
    "order": 3
  },
  "bebidas": {
    "name": "Bebidas",
    "description": "Bebidas geladas para acompanhar sua pizza",
    "icon": "drink",
    "order": 4
  }
}'),
('s0000000-0000-0000-0000-000000000008', 'ui_config', '{
  "texts": {
    "menuTitle": "Menu",
    "categoriesTitle": "Categorias",
    "categories": {
      "entradas": "ENTRADAS",
      "salgadas": "PIZZAS SALGADAS",
      "doces": "PIZZAS DOCES",
      "bebidas": "BEBIDAS"
    }
  },
  "colors": {
    "entradas": "orange-500",
    "salgadas": "primary",
    "doces": "accent",
    "bebidas": "blue-500"
  }
}'),
('s0000000-0000-0000-0000-000000000009', 'social', '{
  "facebook": "https://facebook.com/bellamassa",
  "instagram": "https://instagram.com/bellamassa"
}')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 5. USUÁRIO ADMIN INICIAL (PGCRYPTO)
-- ==============================================

-- ✅ Senha hasheada pelo Postgres usando pgcrypto
-- Username: admin
-- Password: pizzaria123

-- Remover admin antigo (se existir) para recriar com senha correta
DELETE FROM admin_users WHERE username = 'admin';

-- Inserir admin com hash pgcrypto
INSERT INTO admin_users (id, username, email, password_hash, role, is_active) VALUES
(gen_random_uuid(), 'admin', 'admin@pizzaria.com', 
 crypt('pizzaria123', gen_salt('bf', 10)), -- ✅ Hash gerado pelo Postgres
 'admin', true);

-- ==============================================
-- FINALIZAÇÃO
-- ==============================================

-- Verificação dos dados inseridos
SELECT 'Pizza Flavors' as tabela, count(*) as total FROM pizza_flavors
UNION ALL
SELECT 'Extras' as tabela, count(*) as total FROM extras  
UNION ALL
SELECT 'Dough Types' as tabela, count(*) as total FROM dough_types
UNION ALL
SELECT 'Settings' as tabela, count(*) as total FROM pizzeria_settings
UNION ALL
SELECT 'Admin Users' as tabela, count(*) as total FROM admin_users;

-- Verificar hash gerado pelo pgcrypto
SELECT 
  username, 
  LEFT(password_hash, 20) || '...' as hash_preview,
  CASE 
    WHEN password_hash LIKE '$2a$%' THEN '✅ pgcrypto (bcrypt $2a$)'
    WHEN password_hash LIKE '$2b$%' THEN '✅ bcryptjs (bcrypt $2b$)'
    ELSE '❌ Hash inválido'
  END as hash_type
FROM admin_users;

-- ==============================================
-- INSTRUÇÕES DE USO:
-- ==============================================
-- 1. Criar tabelas primeiro:
--    cd backend-pizza
--    npm run db:push
--
-- 2. Habilitar pgcrypto (se ainda não estiver):
--    CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- 3. Executar este script completo no Neon SQL Editor
--
-- 4. Verificar resultado dos SELECTs acima
--
-- 5. Login admin: 
--    Username: admin
--    Password: pizzaria123
--
-- 6. ⚠️ TROCAR SENHA após primeiro login!
--
-- 7. Para trocar senha via SQL:
--    UPDATE admin_users
--    SET password_hash = crypt('nova_senha', gen_salt('bf', 10))
--    WHERE username = 'admin';
--
-- ==============================================
-- NOTAS TÉCNICAS:
-- ==============================================
-- ✅ pgcrypto gera hashes $2a$ (compatível com $2b$ bcryptjs)
-- ✅ Cost 10 = bom equilíbrio segurança/performance
-- ✅ ON CONFLICT DO NOTHING = pode rodar múltiplas vezes
-- ✅ Hash computation no Postgres = 0 CPU no Worker
-- ==============================================
