# 🚀 Guia de Instalação - Cloudflare Workers

## 📁 Arquitetura do Projeto
```
📁 Projeto Cloud (Produção)
├── frontend-pizzaria/ → Cloudflare Pages (React)
├── backend-pizzaria/ → Cloudflare Workers (Hono)
└── Neon PostgreSQL Database
```

## 🗄️ **PASSO 1: Configurar Banco Neon PostgreSQL**

### 1.1 Criar Projeto no Neon
1. Acesse [neon.tech](https://neon.tech) e crie conta
2. **Create Project** → escolha região (preferencialmente US East)
3. Anote a **DATABASE_URL** completa
4. Formato: `postgresql://user:pass@host/dbname?sslmode=require`

### 1.2 Aplicar Schema ao Banco
```bash
cd backend-pizzaria

# Configurar DATABASE_URL localmente
echo "DATABASE_URL=postgresql://..." > .dev.vars

# Aplicar schema
npm run db:push

# Se houver warning de data loss
npm run db:push:force
```

### 1.3 Popular Banco com Dados (Opcional)
Use o Drizzle Studio ou SQL direto no Neon Console:
```bash
npm run db:studio
```

## 🔧 **PASSO 2: Deploy Backend no Cloudflare Workers**

### 2.1 Instalar Wrangler CLI
```bash
npm install -g wrangler

# Login no Cloudflare
wrangler login
```

### 2.2 Configurar Secrets
Configure os secrets de produção:

```bash
cd backend-pizzaria

# Database
wrangler secret put DATABASE_URL
# Cole: postgresql://user:pass@host/dbname?sslmode=require

# JWT Secret (gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
wrangler secret put JWT_SECRET
# Cole: seu_secret_64_caracteres_aleatorios

# CORS Origins (opcional, lista separada por vírgula)
wrangler secret put CORS_ORIGINS
# Cole: https://seu-frontend.pages.dev

# Cloudinary (opcional, se usar upload de imagens)
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
```

### 2.3 Deploy
```bash
# Build
npm run build

# Deploy para produção
npm run deploy
```

Sua API estará disponível em: `https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev`

## 🌐 **PASSO 3: Deploy Frontend no Cloudflare Pages**

### 3.1 Configurar API URL
Na pasta `frontend-pizzaria/`, configure:

```typescript
// src/lib/api-config.ts ou similar
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api'
```

### 3.2 Deploy no Cloudflare Pages
1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages**
2. **Create a project** → **Connect to Git**
3. Configurações:
   ```bash
   Framework preset: React
   Build command: npm run build
   Build output directory: dist
   Root directory: frontend-pizzaria
   ```

### 3.3 Environment Variables (Cloudflare Pages)
No **Pages** → **Settings** → **Environment Variables**:

```bash
# API URL do Worker
VITE_API_URL=https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api

# Ambiente
VITE_ENV=production
```

## 🔗 **PASSO 4: Configurar CORS**

### 4.1 Atualizar CORS no Worker
Atualize o secret `CORS_ORIGINS` com a URL do frontend:

```bash
wrangler secret put CORS_ORIGINS
# Cole: https://seu-frontend.pages.dev,https://seu-dominio.com
```

### 4.2 Redeploy
```bash
npm run deploy
```

## 🧪 **PASSO 5: Testes de Funcionamento**

### 5.1 Testar Backend (Worker)
```bash
# Health check
curl https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api/health

# Testar dados públicos
curl https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api/flavors
curl https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api/extras
```

### 5.2 Testar Frontend (Pages)
1. Acesse: `https://seu-frontend.pages.dev`
2. Verificar se pizzas carregam
3. Testar carrinho e checkout
4. Confirmar admin panel (se tiver usuário criado)

### 5.3 Testar Autenticação
```bash
# Login admin
curl -X POST https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua_senha"}' \
  -c cookies.txt

# Request autenticado (use o access_token retornado)
curl https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api/admin/dashboard \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -b cookies.txt
```

## 🔒 **PASSO 6: Configuração de Produção**

### 6.1 Domínios Personalizados

**Frontend (Cloudflare Pages):**
1. **Custom domains** → adicionar seu domínio
2. Cloudflare configura DNS automaticamente

**Backend (Cloudflare Workers):**
1. No Workers Dashboard → **Triggers** → **Custom Domains**
2. Adicionar: `api.seudominio.com`
3. Cloudflare configura DNS automaticamente

### 6.2 Atualizar URLs Finais
```bash
# Pages Environment Variables
VITE_API_URL=https://api.seudominio.com/api

# Workers Secret (CORS)
wrangler secret put CORS_ORIGINS
# Cole: https://seudominio.com,https://www.seudominio.com
```

### 6.3 Configurar Cron Job (Opcional)
O Worker já tem cron configurado no `wrangler.toml`:
```toml
[triggers]
crons = ["0 */6 * * *"]  # Limpa sessões a cada 6 horas
```

Ative no Cloudflare Dashboard se necessário.

## ✅ **VERIFICAÇÃO FINAL**

### Checklist de Deploy:
- [ ] ✅ Banco Neon com schema aplicado
- [ ] ✅ Worker deployado e funcionando
- [ ] ✅ Frontend Pages carregando
- [ ] ✅ API conectada corretamente
- [ ] ✅ CORS configurado
- [ ] ✅ Secrets configurados (DATABASE_URL, JWT_SECRET)
- [ ] ✅ Admin login funcional
- [ ] ✅ Refresh tokens funcionando
- [ ] ✅ Domínios personalizados (opcional)

## 🛠️ **Desenvolvimento Local**

### Configurar .dev.vars
```bash
# backend-pizzaria/.dev.vars
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=seu_secret_local_64_caracteres
CORS_ORIGINS=http://localhost:5173,http://localhost:5000
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=demo
CLOUDINARY_API_SECRET=demo
```

### Rodar Localmente
```bash
# Backend (porta 8787)
cd backend-pizzaria
npm run dev

# Frontend (porta 5173)
cd frontend-pizzaria
npm run dev
```

## 🚨 **Troubleshooting**

### "Worker threw exception" no Cloudflare
- Verifique logs: `wrangler tail`
- Confirme DATABASE_URL está configurado como secret
- Teste build local: `npm run build`

### "Failed to fetch" no Frontend
- Confirme VITE_API_URL correto no Pages
- Verifique CORS_ORIGINS no Worker
- Teste API diretamente: `curl https://seu-worker/api/health`

### "Database connection failed"
- Neon pode estar em sleep mode (primeiro request lento)
- Verifique URL completa com SSL: `?sslmode=require`
- Teste conexão: `npm run db:studio`

### "Invalid JWT" ou "Token expired"
- Access tokens expiram em 15min (normal)
- Use endpoint `/api/admin/refresh` com cookie + header `x-csrf`
- Verifique JWT_SECRET está igual entre deploys

## 📊 **Monitoramento**

### Cloudflare Workers Analytics
- Request rate
- Error rate
- CPU time
- Bandwidth

### Cloudflare Pages Analytics  
- Page views
- Performance metrics
- Core Web Vitals

### Neon Metrics
- Connection count
- Query performance
- Storage usage

### Logs em Tempo Real
```bash
# Worker logs
wrangler tail

# Worker logs com filtro
wrangler tail --status error
```

## 🎯 **URLs de Produção**

```bash
# Frontend (Cloudflare Pages)
https://seu-frontend.pages.dev
https://seudominio.com (custom)

# Backend API (Cloudflare Workers)  
https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev/api
https://api.seudominio.com/api (custom)

# Database (Neon)
postgresql://user:pass@host/dbname?sslmode=require
```

## 🔄 **CI/CD Automático**

Cloudflare automaticamente deploya:
- **Workers**: A cada push (via `wrangler deploy` no CI)
- **Pages**: A cada push na branch main
- **Preview**: Para cada Pull Request

### GitHub Actions (Exemplo)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Deploy Worker
      - run: npm install
        working-directory: backend-pizzaria
      - run: npm run deploy
        working-directory: backend-pizzaria
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

**🍕 Backend edge-ready com Cloudflare Workers deployado!**
