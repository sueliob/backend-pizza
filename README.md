# 🍕 Pizzaria Backend - Cloudflare Workers

Backend completo com painel administrativo, autenticação JWT + refresh tokens, e APIs RESTful. Deploy via **Cloudflare Workers** com Hono framework.

## ✨ Principais Funcionalidades

### 🔧 **APIs RESTful Completas**
- **Sabores**: CRUD completo + bulk import para produção
- **Extras**: CRUD completo + bulk import para ingredientes
- **Tipos de Massa**: CRUD completo + bulk import
- **Pedidos**: Criação, consulta e gerenciamento
- **Admin**: Sistema completo de autenticação com refresh tokens
- **Upload**: Sistema seguro de imagens (via Cloudinary URLs)
- **Geolocalização**: Cálculo inteligente com cache CEP

### 🔐 **Sistema de Autenticação Avançado**
- **Access Tokens**: JWT (15min) com `jose` library (edge-compatible)
- **Refresh Tokens**: Opaque tokens (7 days) com rotação automática
- **Cookies HttpOnly**: Secure, SameSite=Strict, Path=/
- **CSRF Protection**: Validação via `x-csrf` header
- **Session Management**: Tabela `sessions` no PostgreSQL
- **Token Rotation**: Refresh token renovado a cada uso
- **Revocation Support**: Sessões podem ser revogadas manualmente

### 📸 **Sistema de Upload**
- Upload direto para Cloudinary (via URLs)
- Validação de tipos e tamanhos
- Fallbacks para diferentes formatos

### 🗺️ **Sistema de Entrega Inteligente**
- **Cache CEP**: PostgreSQL para performance máxima
- **Fallback robusto**: Múltiplas fontes de dados
- **Auto-save**: Cache automático de coordenadas consultadas

## 🚀 Deploy no Cloudflare Workers

### 1. Configuração Inicial

```bash
# Instalar dependências
npm install

# Build do projeto
npm run build
```

### 2. Configurar Secrets

Configure os secrets via Wrangler CLI:

```bash
# Database
npx wrangler secret put DATABASE_URL

# JWT Secret
npx wrangler secret put JWT_SECRET

# Cloudinary (opcional)
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

### 3. Deploy

```bash
# Deploy para produção
npm run deploy

# Ou desenvolvimento local
npm run dev
```

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar ambiente local
# Editar .dev.vars com suas credenciais

# Executar desenvolvimento
npm run dev
```

## 📡 Endpoints da API

### **🍕 Sabores & Produtos**
```
GET    /api/flavors                        # Listar todos os sabores
GET    /api/flavors/:category              # Sabores por categoria
POST   /api/admin/flavors                  # Criar sabor (AUTH)
PUT    /api/admin/flavors/:id              # Atualizar sabor (AUTH)
DELETE /api/admin/flavors/:id              # Excluir sabor (AUTH)
POST   /api/admin/bulk-import-flavors      # Import em massa (AUTH)

# Extras (ingredientes)
GET    /api/extras                         # Listar extras
POST   /api/admin/bulk-import-extras       # Import em massa (AUTH)

# Tipos de massa
GET    /api/dough-types                    # Listar tipos
POST   /api/admin/bulk-import-dough-types  # Import em massa (AUTH)
```

### **📋 Pedidos**
```
POST   /api/orders               # Criar pedido
GET    /api/orders/:id          # Buscar pedido
GET    /api/admin/orders        # Listar pedidos (AUTH)
```

### **👨‍💼 Administração**
```
POST   /api/admin/login         # Login admin
POST   /api/admin/refresh       # Renovar tokens (requer x-csrf header)
POST   /api/admin/logout        # Logout (requer x-csrf header)
GET    /api/admin/me            # Dados do admin
PUT    /api/admin/settings      # Atualizar configurações
GET    /api/admin/dashboard     # Estatísticas
```

### **🗺️ Geolocalização & Configurações**
```
POST   /api/calculate-delivery  # Calcular com cache CEP otimizado
GET    /api/settings            # Configurações públicas
```

## 🔐 Sistema de Autenticação

### **Fluxo de Autenticação**

1. **Login** (`POST /api/admin/login`):
   - Recebe username/password
   - Retorna access_token (JWT, 15min) no body
   - Define refresh_token e csrf_token em cookies HttpOnly

2. **Acesso Protegido**:
   - Header: `Authorization: Bearer <access_token>`
   - Cookies: refresh_token e csrf_token enviados automaticamente

3. **Refresh** (`POST /api/admin/refresh`):
   - Header: `x-csrf: <csrf_token_value>`
   - Cookie: refresh_token
   - Retorna novo access_token
   - Rotaciona refresh_token e csrf_token

4. **Logout** (`POST /api/admin/logout`):
   - Header: `x-csrf: <csrf_token_value>`
   - Revoga sessão no banco
   - Limpa cookies

### **Exemplo de Request**

```javascript
// Login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'admin', password: 'senha' })
});

const { access_token } = await loginResponse.json();

// Request autenticado
await fetch('/api/admin/flavors', {
  headers: { 
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});

// Refresh tokens (quando access_token expirar)
const csrfToken = getCookie('csrf_token');
const refreshResponse = await fetch('/api/admin/refresh', {
  method: 'POST',
  headers: { 'x-csrf': csrfToken },
  credentials: 'include'
});

const { access_token: newToken } = await refreshResponse.json();
```

## 🏗️ Arquitetura

### **Estrutura do Projeto**
```
src/
├── app.ts                      # Aplicação Hono com rotas
├── auth.ts                     # Utilitários JWT/refresh/cookies
├── worker.ts                   # Entry point Cloudflare Workers
├── db.ts                       # Configuração database (Neon HTTP)
└── storage.ts                  # Camada de dados

shared/                         # Compartilhado com frontend
├── schema.ts                   # Schemas Drizzle + Zod
└── constants.ts               # Constantes globais

wrangler.toml                  # Configuração Cloudflare Workers
.dev.vars                      # Variáveis de ambiente locais
```

### **Stack Tecnológico**

**Runtime:**
- Cloudflare Workers (Edge computing)
- Hono framework (Express-like para Workers)

**Autenticação:**
- `jose` - JWT para Workers (edge-compatible)
- SHA-256 hashing para refresh tokens
- HttpOnly cookies com CSRF protection

**Database:**
- PostgreSQL (Neon) via HTTP driver
- Drizzle ORM
- Zod validation

**Integração:**
- Cloudinary (opcional, via URLs)
- CEP cache para delivery

## 🗄️ Banco de Dados

### **Schema Principal (Drizzle ORM)**
```sql
-- Sabores/Produtos
pizza_flavors (
  id, name, description, prices, category,
  image_url, available, created_at, updated_at
)

-- Extras (ingredientes adicionais)
extras (
  id, name, price, category, available, created_at, updated_at
)

-- Tipos de massa
dough_types (
  id, name, price, category, description, available, created_at, updated_at
)

-- Pedidos  
orders (
  id, customer_name, customer_phone, items,
  total, delivery_method, delivery_address, status, created_at
)

-- Configurações
pizzeria_settings (
  id, section, data, created_at, updated_at
)

-- Sistema de usuários admin
admin_users (
  id, username, email, password_hash, role,
  is_active, last_login_at, created_at, updated_at
)

-- Sessões de autenticação (NOVO)
sessions (
  id, user_id, refresh_hash, rotation_count,
  revoked_at, expires_at, created_at
)

-- Cache CEP para performance
cep_cache (
  id, cep, coordinates, address, source,
  created_at, updated_at
)
```

### **Migrations**
```bash
# Aplicar migration  
npm run db:push

# Forçar migration (com data loss warning)
npm run db:push:force

# Abrir Drizzle Studio
npm run db:studio
```

## 🔄 Cron Jobs

O Worker inclui um cron job para limpeza de sessões expiradas:

```toml
# wrangler.toml
[triggers]
crons = ["0 */6 * * *"]  # A cada 6 horas
```

## 📊 Monitoramento

### **Logs no Wrangler**
```bash
# Visualizar logs em tempo real
npx wrangler tail

# Logs de produção
npx wrangler tail --env production
```

### **Health Check**
```bash
GET /api/health

# Resposta
{
  "status": "ok",
  "timestamp": "2025-10-07T10:30:00Z"
}
```

## 🐛 Troubleshooting

### **Problemas Comuns**

**Database connection failed:**
```bash
# Verificar DATABASE_URL
npx wrangler secret list

# Testar localmente
npm run dev
```

**JWT verification failed:**
```bash
# Verificar JWT_SECRET configurado
npx wrangler secret put JWT_SECRET

# Usar secret forte (64+ chars)
```

**CORS errors:**
```bash
# Verificar CORS_ORIGINS no .dev.vars ou secrets
# Formato: https://app.exemplo.com,https://app2.exemplo.com
```

## 📋 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento local (Wrangler)
npm run build            # Build TypeScript
npm run deploy           # Deploy para Cloudflare
npm run db:push          # Aplicar schema ao banco
npm run db:studio        # Abrir Drizzle Studio
npm test:local          # Testar API local
```

## 🎯 Melhorias Implementadas

- [x] **Migração Cloudflare Workers**: De Netlify Functions para Workers
- [x] **Sistema de Refresh Tokens**: Com rotação e revogação
- [x] **CSRF Protection**: Via headers e cookies
- [x] **Session Management**: Tabela de sessões no PostgreSQL
- [x] **Cron Jobs**: Limpeza automática de sessões
- [x] **Edge Computing**: Performance global com Workers

## 🔮 Próximas Melhorias

- [ ] WebSocket para pedidos em tempo real
- [ ] Cache distribuído com Cloudflare KV
- [ ] Rate limiting com Durable Objects
- [ ] Métricas avançadas com Workers Analytics
- [ ] API versioning (v2)

---

**🚀 Backend serverless e edge-ready com Cloudflare Workers!**
