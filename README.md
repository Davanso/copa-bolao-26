# Nação do Bolão 2026

Monorepo com API Express + TypeScript e frontend React/Vite/MUI para um bolão casual da Copa 2026.

## Stack

- Frontend: React + Vite + MUI
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL via Prisma
- Jogos: tabela via `worldcup26.ir` + horários oficiais
- Ao vivo: opcional via `football-data.org`, com fallback local

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
  - `FOOTBALL_DATA_API_TOKEN=seu-token-football-data`
  - `FOOTBALL_DATA_COMPETITION=WC`
  - `FOOTBALL_DATA_CACHE_TTL_MS=70000`
  - `LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK=false`

### Ao vivo com Football-Data

Para testar uma fonte melhor de placar ao vivo:

1. Crie uma conta em `football-data.org`.
2. Copie o token da API.
3. Configure na API:

```bash
FOOTBALL_DATA_API_TOKEN="seu-token"
FOOTBALL_DATA_COMPETITION="WC"
FOOTBALL_DATA_CACHE_TTL_MS="70000"
```

Com token configurado, `/live-games` tenta `football-data.org` primeiro. Se
falhar ou o token não existir, o fallback baseado no horário oficial fica ativo
apenas em desenvolvimento. Em produção, deixe
`LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK=false` para evitar marcar partidas como
ao vivo sem confirmação de placar real. O cache padrão é de 70 segundos para
respeitar o limite grátis de 10 chamadas por minuto.

### Vercel Web

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Variável:
  - `VITE_API_URL=https://sua-api.onrender.com`

Sem `VITE_API_URL` na Vercel, o celular tenta conectar no endereço errado e o
login falha com erro de conexão.
