# 🚀 Deploy Pendente - Cloudflare Workers

## ✅ Mudanças Implementadas (Prontas para Deploy)

### **1. Rotas DELETE Criadas** 
Adicionadas em `backend-pizza/src/app.ts`:

- **DELETE `/api/admin/flavors/:id`** - Linha 445-450
  ```typescript
  app.delete('/api/admin/flavors/:id', async (c) => {
    const db = c.get('db')
    const id = c.req.param('id')
    await db.delete(pizzaFlavors).where(eq(pizzaFlavors.id, id))
    return c.json({ success: true, message: 'Sabor excluído com sucesso' })
  })
  ```

- **DELETE `/api/admin/extras/:id`** - Linha 473-478
  ```typescript
  app.delete('/api/admin/extras/:id', async (c) => {
    const db = c.get('db')
    const id = c.req.param('id')
    await db.delete(extras).where(eq(extras.id, id))
    return c.json({ success: true, message: 'Extra excluído com sucesso' })
  })
  ```

- **DELETE `/api/admin/dough-types/:id`** - Linha 501-506
  ```typescript
  app.delete('/api/admin/dough-types/:id', async (c) => {
    const db = c.get('db')
    const id = c.req.param('id')
    await db.delete(doughTypes).where(eq(doughTypes.id, id))
    return c.json({ success: true, message: 'Tipo de massa excluído com sucesso' })
  })
  ```

### **2. Rota de Atualização de Credenciais**
Adicionada em `backend-pizza/src/app.ts` - Linha 576-612:

- **PUT `/api/admin/update-credentials`**
  - Verifica senha atual com pgcrypto
  - Atualiza username e password
  - Requer autenticação JWT

### **3. Fix TypeScript**
- Corrigido type assertion para `userId` na rota update-credentials
- Build TypeScript agora compila sem erros: ✅ `npm run build` passou

---

## 📋 Como Fazer o Deploy Manual

### **Opção 1: Via Wrangler CLI (Recomendado)**

```bash
cd backend-pizza
npm run build
npm run deploy
```

### **Opção 2: Via Dashboard Cloudflare**

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages**
3. Selecione o worker **backend-pizza**
4. Faça upload do código compilado de `backend-pizza/dist/`

---

## ✅ Frontend Já Está Pronto

O frontend já está conectado às novas rotas DELETE:
- Botões de exclusão funcionais em **Produtos**, **Extras** e **Massas**
- Confirmação via `window.confirm()` antes de deletar
- Mutation handlers com invalidação de cache TanStack Query
- Estado de loading (`isPending`) nos botões durante exclusão

**Arquivo:** `frontend-pizza/src/pages/admin-complete.tsx`
- Linha 424-435: `deleteProductMutation`
- Linha 632-660: `ProductCard` com botão delete
- Linha 1027-1037: `deleteDoughMutation`  
- Linha 1174-1184: `deleteExtraMutation`

---

## 🔧 Variável de Ambiente

Certifique-se de que o frontend em produção tenha:

```env
VITE_API_BASE=https://api.curiooso.com.br/api
```

Configurado no **Cloudflare Pages** > **Settings** > **Environment Variables**

---

## 🧪 Teste Após Deploy

1. Acesse: https://m.curiooso.com.br/admin
2. Faça login
3. Vá em **Produtos**, **Extras** ou **Massas**
4. Clique no ícone de lixeira 🗑️
5. Confirme a exclusão
6. O item deve ser removido com sucesso

---

**Status:** ✅ Código pronto | ⏳ Aguardando deploy para api.curiooso.com.br
