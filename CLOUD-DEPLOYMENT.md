# 🚀 Guia de Deploy Cloud Production

## Visão Geral

Este guia orienta o deploy do backend na **Cloudflare Workers** e frontend no domínio **m.curiooso.com.br**, com API em **api.curiooso.com.br**.

---

## 📋 Pré-requisitos

### 1. Banco de Dados Neon PostgreSQL

- ✅ Criar projeto no [Neon Console](https://console.neon.tech)
- ✅ Copiar `DATABASE_URL` (connection string)

### 2. Google Maps API Key

- ✅ Habilitar APIs necessárias:
  - Geocoding API
  - Routes API v2 (Compute Routes - Essentials)
- ✅ Copiar `GOOGLE_MAPS_API_KEY`

### 3. Cloudflare Account

- ✅ Conta Cloudflare ativa
- ✅ Workers habilitado
- ✅ Domínio configurado (curiooso.com.br)

---

## 🗄️ Passo 1: Configurar Banco de Dados

### 1.1 Criar Schema

No Neon SQL Editor, execute:

```bash
cd backend-pizza
npm run db:push
```

Ou execute manualmente as migrations do Drizzle.

### 1.2 Executar Seed

No **Neon SQL Editor**, copie e execute todo o conteúdo de:

```
backend-pizza/production-seed-pgcrypto.sql
```

**Importante:** Execute o arquivo completo de uma vez!

### 1.3 Verificar Resultado

Ao final, você verá:

```
✅ Pizza Flavors: 20
✅ Extras: 18
✅ Dough Types: 7
✅ Settings: 9
✅ Admin Users: 1
```

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Backend (Cloudflare Workers)

Configure secrets no Cloudflare Workers:

```bash
# DATABASE_URL
npx wrangler secret put DATABASE_URL
# Cole a connection string do Neon

# GOOGLE_MAPS_API_KEY
npx wrangler secret put GOOGLE_MAPS_API_KEY
# Cole sua API key do Google Maps

# JWT_SECRET (gere uma chave segura)
npx wrangler secret put JWT_SECRET
# Exemplo: openssl rand -hex 32
```

### 2.2 Frontend

Arquivo `.env` (ou variáveis no Cloudflare Pages):

```env
VITE_API_BASE=https://api.curiooso.com.br/api
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

---

## ☁️ Passo 3: Deploy Backend (Cloudflare Workers)

### 3.1 Configurar wrangler.toml

Edite `backend-pizza/wrangler.toml`:

```toml
name = "pizzaria-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[routes]
pattern = "api.curiooso.com.br/*"
zone_name = "curiooso.com.br"
```

### 3.2 Build e Deploy

```bash
cd backend-pizza
npm run build
npx wrangler deploy
```

### 3.3 Verificar

Teste a API:

```bash
curl https://api.curiooso.com.br/api/health
# Esperado: {"status":"ok"}
```

---

## 🌐 Passo 4: Deploy Frontend (Cloudflare Pages)

### 4.1 Build

```bash
cd frontend-pizza
npm run build
```

### 4.2 Deploy

Via Cloudflare Dashboard:

1. **Pages** → **Create a project** → **Upload assets**
2. Upload pasta `frontend-pizza/dist`
3. Configurar custom domain: `m.curiooso.com.br`

Ou via Wrangler:

```bash
cd frontend-pizza
npx wrangler pages deploy dist --project-name=pizzaria-menu
```

### 4.3 Configurar Variáveis de Ambiente

No Cloudflare Pages Settings:

- `VITE_API_BASE`: `https://api.curiooso.com.br/api`
- `VITE_GOOGLE_MAPS_API_KEY`: (sua chave)

---

## ✅ Passo 5: Verificação Pós-Deploy

### 5.1 Testar Backend

```bash
# Health check
curl https://api.curiooso.com.br/api/health

# Listar sabores
curl https://api.curiooso.com.br/api/flavors/salgadas

# Configurações públicas
curl https://api.curiooso.com.br/api/public/settings
```

### 5.2 Testar Frontend

Acesse: `https://m.curiooso.com.br`

Verifique:
- ✅ Página inicial carrega
- ✅ Categorias exibem preços corretos
- ✅ Imagens dos sabores aparecem
- ✅ Formulários de pedido funcionam

### 5.3 Testar Admin Panel

Acesse: `https://m.curiooso.com.br/admin`

**Login padrão:**
- Username: `admin`
- Password: `pizzaria123`

**⚠️ IMPORTANTE:** Troque a senha imediatamente!

---

## 🔧 Passo 6: Configuração Inicial da Pizzaria

### 6.1 Trocar Senha do Admin

No Admin Panel: **Configurações** → **Segurança**

Ou via SQL:

```sql
UPDATE admin_users
SET password_hash = crypt('nova_senha_segura', gen_salt('bf', 10))
WHERE username = 'admin';
```

### 6.2 Atualizar Dados da Pizzaria

**Configurações** → **Marca**
- Nome da pizzaria
- Logo
- Cores personalizadas

**Configurações** → **Contato**
- WhatsApp (com código de país: 5511987654321)
- Telefone
- Email

**Configurações** → **Endereço**
- Endereço completo com CEP
- Sistema calculará coordenadas automaticamente

### 6.3 Configurar Formas de Pagamento

**Configurações** → **Formas de Pagamento**

Marque as bandeiras aceitas:
- Crédito: Visa, Elo, Mastercard, Amex
- Débito: Visa, Elo, Mastercard
- Alimentação: Alelo, VR, Ticket, Sodexo
- PIX e Dinheiro

### 6.4 Ajustar Taxas de Entrega

**Configurações** → **Entrega**

Configure:
- **Taxa Mínima** (baseFee): Ex: R$ 5,00
- **Taxa por Faixa** (feePerRange): Ex: R$ 2,50
- **Km por Faixa** (kmRange): Ex: 3 km
- **Tempo Base** (baseTime): Ex: 45 min

**Exemplo de cálculo:**
- Distância: 8 km
- Faixas: 8 ÷ 3 = 3 faixas
- Taxa: 3 × R$ 2,50 = R$ 7,50
- Final: max(R$ 7,50, R$ 5,00) = **R$ 7,50**

---

## 🎨 Passo 7: Personalizar Cardápio

### 7.1 Adicionar/Editar Sabores

**Admin Panel** → **Sabores**

- Edite sabores existentes (preços, descrições, imagens)
- Adicione novos sabores
- Desative sabores temporariamente

**Estrutura de Preços:**
- **Pizzas Salgadas**: `grande` e `individual`
- **Pizzas Doces**: `media` e `individual`
- **Entradas/Bebidas**: `unico`

### 7.2 Configurar Extras e Massas

**Admin Panel** → **Extras** / **Tipos de Massa**

Edite bordas, ingredientes extras e opções de massa.

---

## 🐛 Troubleshooting

### Erro: "Serviço de cálculo de entrega indisponível"

**Causa:** Google Maps API key inválida ou APIs não habilitadas

**Solução:**
1. Verifique se `GOOGLE_MAPS_API_KEY` está configurada
2. Habilite Geocoding API e Routes API v2
3. Verifique restrições da API key

### Erro: Preços R$ 0,00

**Causa:** QueryKeys com `/api` duplicado

**Solução:** Já corrigido! Verifique:
- `VITE_API_BASE` termina com `/api`
- QueryKeys **não** começam com `/api`

### Erro: Admin não consegue fazer login

**Causa:** Senha incorreta ou hash incompatível

**Solução:**
1. Verifique se o seed foi executado
2. Use senha padrão: `pizzaria123`
3. Se necessário, recrie o admin via SQL (veja seed)

### Erro: CORS ao chamar API

**Causa:** Origem não permitida

**Solução:** Configure CORS no backend:

```typescript
// backend-pizza/src/app.ts
app.use('*', cors({
  origin: ['https://m.curiooso.com.br'],
  credentials: true,
}));
```

---

## 📊 Monitoramento

### Logs do Backend (Cloudflare Workers)

```bash
npx wrangler tail
```

### Analytics (Cloudflare Dashboard)

- **Workers Analytics**: Requisições, erros, latência
- **Pages Analytics**: Pageviews, performance

---

## 🔄 Atualizações Futuras

### Atualizar Backend

```bash
cd backend-pizza
npm run build
npx wrangler deploy
```

### Atualizar Frontend

```bash
cd frontend-pizza
npm run build
npx wrangler pages deploy dist
```

---

## 📞 Suporte

Para problemas técnicos:
1. Verifique logs do Cloudflare Workers
2. Teste endpoints da API com curl
3. Verifique console do navegador
4. Consulte documentação do Neon/Cloudflare

---

## ✨ Checklist Final

- [ ] Banco de dados criado e seed executado
- [ ] Variáveis de ambiente configuradas
- [ ] Backend deployado em api.curiooso.com.br
- [ ] Frontend deployado em m.curiooso.com.br
- [ ] Admin login funcionando
- [ ] Senha do admin trocada
- [ ] Dados da pizzaria atualizados
- [ ] Formas de pagamento configuradas
- [ ] Taxas de entrega ajustadas
- [ ] Cardápio personalizado
- [ ] Testes de pedido completos (pickup e delivery)
- [ ] Google Maps calculando distâncias corretamente
- [ ] WhatsApp redirecionando pedidos

**🎉 Parabéns! Sua pizzaria está online!**
