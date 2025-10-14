Criar as tabelas (modo ultra-rápido)

Abra o backend no VS Code
Arquivo → Open Folder… → selecione a pasta do backend (onde estão package.json, drizzle.config.ts, src/db/schema.ts).

Defina a DATABASE_URL (Neon)

A URL do Neon precisa ter ?sslmode=require.

Windows (PowerShell – terminal padrão do VS Code)

$env:DATABASE_URL = "postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"


macOS/Linux (bash/zsh)

export DATABASE_URL="postgres://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"


Gerar e aplicar as migrations

# dentro da pasta do backend, no terminal do VS Code
npm i -D drizzle-kit
npx drizzle-kit generate
npx drizzle-kit push


Pronto. Isso cria as tabelas no Neon com base no seu src/db/schema.ts.

Dicas rápidas (se algo falhar)

Erro de config: confirme que existe um drizzle.config.ts apontando para seu schema e pasta drizzle.

Permissão/URL: confira usuário/senha/DB no Neon e o sslmode=require.

Sem Node 18+: atualize o Node (recomendado 18+).