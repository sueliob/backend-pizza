# 🔧 Correção: Endereço, Taxas de Entrega e Horários

## 🔍 Problemas Identificados

### **1. Endereço e Taxas de Entrega (Painel Admin)**

As seções **"Endereço"** e **"Taxas de Entrega"** não aparecem no painel admin porque:

1. **Delivery**: Estrutura de dados incompatível entre banco e frontend
2. **Address**: Seção não existe no banco (endereço está dentro de "contact" como string)

### **2. Horários de Funcionamento (Página Menu)**

Os **horários de funcionamento** na página Menu estavam hardcoded (fixos no código), não refletindo os dados do banco de dados.

---

## ✅ Soluções Disponíveis

### **Opção 1: Executar Script SQL (Recomendado)**

Execute o script `fix-settings.sql` no seu banco Neon PostgreSQL:

```bash
# Via psql
psql $DATABASE_URL -f backend-pizza/fix-settings.sql

# Ou copie e cole o conteúdo no SQL Editor do Neon Dashboard
```

### **Opção 2: Criar Manualmente no Painel Admin**

1. Acesse o painel admin: `https://m.curiooso.com.br/admin`
2. Login com credenciais de admin
3. Vá em **Configurações** > **Endereço** > **Editar**
4. Preencha os campos e salve
5. Vá em **Configurações** > **Taxas de Entrega** > **Editar**
6. Preencha os campos e salve

---

## 📊 Estruturas Corretas

### **Delivery (Taxas de Entrega)**

```json
{
  "baseFee": 5.00,
  "feePerRange": 2.50,
  "kmRange": 3,
  "baseTime": 45
}
```

**Campos:**
- `baseFee`: Taxa base de entrega (R$)
- `feePerRange`: Taxa adicional por faixa de distância (R$)
- `kmRange`: Distância de cada faixa (km)
- `baseTime`: Tempo base de entrega (minutos)

### **Address (Endereço)**

```json
{
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
}
```

---

## 🧪 Verificar Correção

Após executar o script, verifique no painel admin se as seções aparecem corretamente preenchidas.

```sql
-- Verificar no banco
SELECT section, data 
FROM pizzeria_settings 
WHERE section IN ('delivery', 'address');
```

---

## 📝 Histórico de Alterações

- **14/10/2025**: Identificado problema de incompatibilidade de estrutura (endereço e delivery)
- **14/10/2025**: Criado script de correção e atualizado seed
- **14/10/2025**: Corrigido horários hardcoded na página Menu (agora busca do banco via `business_hours`)
