# 🧱 Criar as Tabelas (Modo Ultra-Rápido)

## 1. Abra o backend no VS Code

1. Vá em **Arquivo → Open Folder…**  
2. Selecione a pasta do backend (onde estão `package.json`, `drizzle.config.ts` e `src/db/schema.ts`).

---

## 2. Defina a `DATABASE_URL` (Neon)

A URL do banco **Neon** precisa conter o sufixo `?sslmode=require`.

### 🪟 Windows (PowerShell – terminal padrão do VS Code)

```powershell
$env:DATABASE_URL = "postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
