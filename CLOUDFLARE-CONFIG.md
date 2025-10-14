# ⚙️ Configuração Cloudflare Workers - Backend Pizzaria

Guia completo de configuração do backend usando Cloudflare Workers com Hono framework.

## 📋 Pré-requisitos

- Conta no [Cloudflare](https://dash.cloudflare.com/)
- Wrangler CLI instalado
- Banco de dados PostgreSQL (Neon recomendado)
- Node.js 18+ instalado

## 🔄 Implantação Automática (CI/CD com Cloudflare Pages)

### **Configuração de Compilações e Implantações Automáticas**

Ao configurar o deploy automático no Cloudflare Pages para o backend, use estas configurações:

```
Nome do projeto: backend-pizza

Comandos de criação e implantação:
├── Comando da build: npm run build
└── Comando de implantação: npx wrangler deploy

Compilações:
└── ☑ Habilitar compilações para ramificações de não produção

Configurações avançadas:
├── Comando de implantação da ramificação de não produção: npx wrangler deploy
├── Diretório raiz: (deixar vazio)
├── Token de API: (configurar via CLOUDFLARE_API_TOKEN)
└── Criar variáveis: (ver seção Secrets abaixo)
```

### **Configurar Token de API para CI/CD**

Para deploy automático via GitHub Actions ou Cloudflare Pages:

1. **Criar API Token no Cloudflare:**
   - Dashboard → **My Profile** → **API Tokens**
   - **Create Token** → usar template **"Edit Cloudflare Workers"**
   - Copie o token gerado

2. **Configurar no GitHub (para CI/CD):**
   - Repositório → **Settings** → **Secrets and variables** → **Actions**
   - **New repository secret**:
     - Nome: `CLOUDFLARE_API_TOKEN`
     - Valor: (cole o token)

3. **Configurar no Cloudflare Pages:**
   - Na seção "Token de API" da configuração de build
   - Cole o token gerado

### **Variáveis de Ambiente no Deploy Automático**

Configure os secrets via Wrangler CLI (são automaticamente usados no CI/CD):

```bash
# Obrigatórios
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET

# Opcionais
wrangler secret put CORS_ORIGINS
wrangler secret put GOOGLE_MAPS_API_KEY
```

---

## 🚀 Configuração Inicial

### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler

# Login no Cloudflare
wrangler login
```

### 2. Configurar Projeto

```bash
cd backend-pizzaria

# Instalar dependências
npm install

# Verificar configuração do Wrangler
cat wrangler.toml
```

## 🔐 Configurar Secrets de Produção

### Secrets Obrigatórios

```bash
# 1. Database URL (Neon PostgreSQL)
wrangler secret put DATABASE_URL
# Cole: postgresql://user:pass@host/dbname?sslmode=require

# 2. JWT Secret (gerar com node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
wrangler secret put JWT_SECRET
# Cole: sua_chave_aleatoria_64_caracteres
```

### Secrets Opcionais

```bash
# 3. CORS Origins (lista separada por vírgula)
wrangler secret put CORS_ORIGINS
# Cole: https://seu-frontend.pages.dev,https://seu-dominio.com

# 4. Google Maps API Key (para cálculo de entrega)
wrangler secret put GOOGLE_MAPS_API_KEY
# Cole: AIzaSy...sua_chave_google_maps

# 5. Cloudinary (para upload de imagens)
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
```

### Verificar Secrets Configurados

```bash
wrangler secret list
```

## 🗄️ Configurar Banco de Dados

### 1. Criar Banco no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Copie a **DATABASE_URL** completa
4. Formato: `postgresql://user:pass@host/dbname?sslmode=require`

### 2. Aplicar Schema

```bash
# Configurar .dev.vars para desenvolvimento local
echo "DATABASE_URL=postgresql://..." > .dev.vars

# Aplicar schema ao banco
npm run db:push

# Se houver warning de data loss
npm run db:push:force
```

### 3. Verificar Tabelas

```bash
# Abrir Drizzle Studio
npm run db:studio

# Ou verificar via SQL no Neon Console
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

## 🔨 Build e Deploy

### Desenvolvimento Local

```bash
# Executar localmente (porta 8787)
npm run dev

# Testar endpoints
curl http://localhost:8787/api/health
curl http://localhost:8787/api/flavors
```

### Build de Produção

```bash
# Build TypeScript
npm run build

# Verificar arquivos compilados
ls -la dist/src/
```

### Deploy para Cloudflare

```bash
# Deploy para produção
npm run deploy

# Sua API estará em:
# https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev
```

## 🌐 Configurar Domínio Personalizado

### No Cloudflare Dashboard

1. Acesse **Workers & Pages** → seu worker
2. Vá em **Triggers** → **Custom Domains**
3. Clique em **Add Custom Domain**
4. Digite: `api.seudominio.com`
5. Cloudflare configura DNS automaticamente

### Atualizar CORS

```bash
# Atualizar origins permitidas
wrangler secret put CORS_ORIGINS
# Cole: https://seudominio.com,https://www.seudominio.com
```

## ⏰ Configurar Cron Jobs

O Worker já tem cron configurado no `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Limpa sessões expiradas a cada 6 horas
```

### Personalizar Agendamento

Edite `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 */6 * * *",    # A cada 6 horas
  "0 2 * * *",      # Todos os dias às 2am
  "*/15 * * * *"    # A cada 15 minutos
]
```

### Ativar Cron no Cloudflare

1. Dashboard → Workers → seu worker
2. Vá em **Triggers** → **Cron Triggers**
3. Verifique se está ativado

## 🔍 Monitoramento e Logs

### Visualizar Logs em Tempo Real

```bash
# Logs de produção
wrangler tail

# Logs com filtro de erro
wrangler tail --status error

# Logs com formato JSON
wrangler tail --format json
```

### Métricas no Dashboard

Acesse **Workers & Pages** → seu worker → **Metrics**:

- Request rate
- Error rate
- CPU time
- Success rate
- Bandwidth

## 🧪 Testes

### Testar Endpoints Públicos

```bash
# Health check
curl https://seu-worker.workers.dev/api/health

# Listar sabores
curl https://seu-worker.workers.dev/api/flavors

# Listar extras
curl https://seu-worker.workers.dev/api/extras
```

### Testar Autenticação

```bash
# 1. Login
curl -X POST https://seu-worker.workers.dev/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua_senha"}' \
  -c cookies.txt -v

# 2. Usar access_token
curl https://seu-worker.workers.dev/api/admin/dashboard \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -b cookies.txt

# 3. Refresh tokens
curl -X POST https://seu-worker.workers.dev/api/admin/refresh \
  -H "x-csrf: SEU_CSRF_TOKEN" \
  -b cookies.txt -v
```

### Testar Cálculo de Entrega

```bash
curl -X POST https://seu-worker.workers.dev/api/calculate-delivery \
  -H "Content-Type: application/json" \
  -d '{"cep":"01310-100","deliveryMethod":"moto"}'
```

## 🔧 Configuração Avançada

### Aumentar Limites do Worker

Edite `wrangler.toml`:

```toml
[env.production]
compatibility_date = "2025-01-07"
limits = { cpu_ms = 50 }  # Limite de CPU (padrão: 10ms)
```

### Adicionar KV Storage (opcional)

```bash
# Criar namespace KV
wrangler kv:namespace create "CACHE"

# Adicionar ao wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "seu_kv_namespace_id"
```

### Configurar Rate Limiting

Implemente rate limiting no código usando Cloudflare's built-in features ou manualmente.

## 🐛 Troubleshooting

### "Worker threw exception"

```bash
# Verificar logs
wrangler tail

# Verificar build
npm run build

# Testar localmente
npm run dev
```

### "Database connection failed"

```bash
# Verificar DATABASE_URL
wrangler secret list

# Testar conexão local
npm run db:studio

# Neon pode estar em sleep mode (primeiro request lento)
```

### "Invalid JWT" / "Token expired"

```bash
# Access tokens expiram em 15min (comportamento normal)
# Use /api/admin/refresh para renovar

# Verificar JWT_SECRET
wrangler secret list

# Secret deve ser o mesmo entre deploys
```

### "CORS error" no Frontend

```bash
# Verificar CORS_ORIGINS
wrangler secret list

# Atualizar com URL do frontend
wrangler secret put CORS_ORIGINS
```

## 📊 Variáveis de Ambiente

### .dev.vars (Desenvolvimento Local)

```bash
# .dev.vars
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=seu_secret_dev_64_caracteres
CORS_ORIGINS=http://localhost:5173,http://localhost:5000
GOOGLE_MAPS_API_KEY=AIzaSy...sua_chave
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=demo
CLOUDINARY_API_SECRET=demo
```

### Secrets de Produção (Cloudflare)

Todos os secrets são configurados via Wrangler CLI e armazenados com segurança no Cloudflare.

**Nunca commite secrets no Git!**

## 🔄 CI/CD com GitHub Actions

### Exemplo de Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Worker
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: backend-pizzaria
      
      - name: Build
        run: npm run build
        working-directory: backend-pizzaria
      
      - name: Deploy to Cloudflare
        run: npm run deploy
        working-directory: backend-pizzaria
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Configurar CLOUDFLARE_API_TOKEN

1. Cloudflare Dashboard → **My Profile** → **API Tokens**
2. **Create Token** → usar template "Edit Cloudflare Workers"
3. Copie o token
4. GitHub → Settings → Secrets → **New secret**
5. Nome: `CLOUDFLARE_API_TOKEN`

## 📝 Checklist de Deploy

- [ ] ✅ Wrangler CLI instalado e autenticado
- [ ] ✅ Banco Neon criado e schema aplicado
- [ ] ✅ DATABASE_URL configurado como secret
- [ ] ✅ JWT_SECRET configurado como secret
- [ ] ✅ CORS_ORIGINS configurado (se necessário)
- [ ] ✅ Google Maps API configurada (se usar entrega)
- [ ] ✅ Build funcionando (`npm run build`)
- [ ] ✅ Worker deployado (`npm run deploy`)
- [ ] ✅ Endpoints públicos testados
- [ ] ✅ Autenticação admin testada
- [ ] ✅ Cron job ativado (se necessário)
- [ ] ✅ Domínio personalizado configurado (opcional)
- [ ] ✅ Monitoramento configurado

## 🎯 URLs Importantes

### Desenvolvimento
- Worker local: `http://localhost:8787`
- Drizzle Studio: `https://local.drizzle.studio`

### Produção
- Worker: `https://backend-pizzaria.SEU_SUBDOMAIN.workers.dev`
- Custom domain: `https://api.seudominio.com`
- Cloudflare Dashboard: `https://dash.cloudflare.com`
- Neon Console: `https://console.neon.tech`

## 📚 Recursos

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Neon Database](https://neon.tech/docs)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

**🚀 Backend pronto para produção com Cloudflare Workers!**
