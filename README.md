# Nação do Bolão 2026

Monorepo com API Express + TypeScript e frontend React/Vite/MUI para um bolão casual da Copa 2026.

## Stack

- Frontend: React + Vite + MUI
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL via Prisma
- Jogos: API externa `worldcup26.ir` (não persistimos jogos no banco)

## Rodar localmente

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3333

### Acessar pelo celular em desenvolvimento

Use o IP da máquina na mesma rede Wi-Fi:

```bash
VITE_API_URL="http://SEU_IP_DA_REDE:3333"
```

Depois abra no celular:

```text
http://SEU_IP_DA_REDE:5173
```

Exemplo: se o PC estiver em `192.168.0.10`, use
`VITE_API_URL="http://192.168.0.10:3333"` e abra
`http://192.168.0.10:5173`.

## Banco

Crie um Postgres (recomendado: Neon) e configure:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="troque-esse-segredo"
```

Depois rode:

```bash
npm --workspace apps/api run db:generate
npm --workspace apps/api run db:deploy
```

O usuário admin é criado automaticamente ao iniciar a API se não existir.

- Admin padrão: `admin` / `admin123`
- Para trocar: use `ADMIN_USERNAME` e `ADMIN_PASSWORD`

## Deploy recomendado

### Neon

1. Criar projeto Postgres.
2. Copiar `DATABASE_URL` com `sslmode=require`.
3. Usar essa URL no Render.

### Render API

- Root directory: `apps/api`
- Build command: `npm install && npm run db:generate && npm run build && npm run db:deploy`
- Start command: `npm start`
- Variáveis:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `WEB_ORIGIN=https://seu-front.vercel.app`
  - `WORLD_CUP_API_URL=https://worldcup26.ir/get/games`

### Vercel Web

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Variável:
  - `VITE_API_URL=https://sua-api.onrender.com`

Sem `VITE_API_URL` na Vercel, o celular tenta conectar no endereço errado e o
login falha com erro de conexão.
