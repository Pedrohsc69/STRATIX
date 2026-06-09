# Deploy STRATIX

## Visão Geral

- Backend: Render
- Frontend: Vercel
- Banco relacional: PostgreSQL
- Auditoria: MongoDB
- ORM: Prisma
- E-mails: Resend

## Backend Render

### Comandos

- Install: `npm ci`
- Build: `npm run build -w @stratix/api`
- Start: `npm run start:prod -w @stratix/api`
- Migration: `npm run prisma:migrate:deploy -w @stratix/api`

### Variáveis obrigatórias

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `MONGO_URL` ou `MONGODB_URI`
- `MONGO_DB` ou `MONGODB_DATABASE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`
- `PORT`

### Observações

- O backend expõe health check em `GET /api/health`.
- O CORS usa `FRONTEND_URL` e não deixa wildcard aberto.
- Produção deve usar `prisma migrate deploy`.
- Não usar `prisma migrate dev` em produção.
- O build do backend executa `prisma generate` antes da compilação TypeScript.

## Frontend Vercel

### Comandos

- Install: `npm ci`
- Build: `npm run build -w @stratix/web`
- Output directory: `apps/web/dist`

### Variável obrigatória

- `VITE_API_BASE_URL=https://url-do-backend`

### Observações

- Não colocar segredos no frontend.
- O frontend usa apenas variáveis `VITE_*`.
- O arquivo `vercel.json` já inclui rewrite para SPA fallback.

## Banco de Dados

### PostgreSQL

- Prisma usa `DATABASE_URL`.
- O schema Prisma está em `apps/api/prisma/schema.prisma`.
- O provider atual é `postgresql`.
- O repositório já inclui histórico de migrations para uso com `prisma migrate deploy`.
- Se o banco de produção já existir fora desse histórico, fazer baseline antes do primeiro deploy.

### MongoDB

- Auditoria usa `MONGO_URL` + `MONGO_DB`
- Também aceita `MONGODB_URI` + `MONGODB_DATABASE`

## Resend

- Configurar `RESEND_API_KEY`
- Configurar `EMAIL_FROM` com domínio/remetente válido
- Configurar `FRONTEND_URL` com a URL real do frontend para links de convite e reset

## Docker Local

O repositório já possui `docker-compose.yml` com:

- `postgres`
- `mongo`

Uso recomendado para homologação local:

```bash
docker compose up -d postgres mongo
```

As variáveis `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` estão documentadas no `.env.example` da raiz.

## Validação Antes do Deploy

Executar localmente:

```bash
npm run build -w @stratix/api
npm test -w @stratix/api
npm run lint -w @stratix/api
npm run build -w @stratix/web
npm run lint -w @stratix/web
docker compose config
```
