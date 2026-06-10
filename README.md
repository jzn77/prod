# ⚡ Personal Hub — Production Ready

> Sistema Inteligente de Gestão Pessoal — SaaS completo, seguro e pronto para produção.

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/personal-hub)

---

## Índice

1. [Como Instalar](#como-instalar)
2. [Como Executar](#como-executar)
3. [Deploy para Produção](#deploy-para-produção)
4. [Banco de Dados Online](#banco-de-dados-online)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Segurança](#segurança)
7. [Autenticação](#autenticação)
8. [Monitoramento](#monitoramento)
9. [Backup e Restore](#backup-e-restore)
10. [Scripts Disponíveis](#scripts-disponíveis)
11. [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)

---

## Como Instalar

### Setup automático (recomendado)

```bash
git clone https://github.com/seu-usuario/personal-hub.git
cd personal-hub
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

### Setup manual

```bash
npm install
cp .env.example .env.local
# Edite .env.local com suas credenciais
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed   # opcional — dados de exemplo
```

**Login de exemplo (após seed):** `joao@exemplo.com` / `senha123`

---

## Como Executar

```bash
npm run dev       # Desenvolvimento (http://localhost:3000)
npm run build     # Build de produção
npm run start     # Servidor de produção
make db-studio    # Visualizar banco (Prisma Studio)
```

---

## Deploy para Produção

### Vercel (recomendado — zero config)

1. Instale a CLI: `npm i -g vercel`
2. Configure as variáveis no Dashboard Vercel
3. Execute: `make deploy-prod`

**Variáveis obrigatórias na Vercel:**

| Variável | Como obter |
|----------|-----------|
| `DATABASE_URL` | Supabase > Settings > Database |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | platform.openai.com |
| `RESEND_API_KEY` | resend.com |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io |
| `NEXT_PUBLIC_APP_URL` | https://seuapp.vercel.app |

### Deploy automático via GitHub Actions

Adicione estes secrets no repositório (Settings > Secrets):
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`

Todo push para `main` fará deploy automático com migrations.

### Domínio personalizado

1. Vercel Dashboard > Settings > Domains → adicione seu domínio
2. Aponte DNS: registro `CNAME` para `cname.vercel-dns.com`
3. SSL/HTTPS é automático

---

## Banco de Dados Online

### Supabase (recomendado — gratuito)

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie um projeto
3. Acesse **Settings > Database** → copie a **Transaction Pooler** connection string
4. Cole em `DATABASE_URL` no `.env.local`
5. Execute: `npx prisma migrate deploy`

### Neon (alternativa gratuita)

1. Crie conta em [neon.tech](https://neon.tech)
2. Copie a connection string com `?sslmode=require`
3. Configure em `DATABASE_URL`

---

## Variáveis de Ambiente

Veja [`.env.example`](.env.example) para a lista completa. Mínimo para rodar:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="string-32-chars-min"
JWT_REFRESH_SECRET="outra-string-diferente"
NEXT_PUBLIC_APP_URL="https://seuapp.vercel.app"
```

---

## Segurança

Implementado em múltiplas camadas:

**Headers HTTP (`next.config.ts`):**
- `Strict-Transport-Security` — força HTTPS
- `X-Frame-Options: DENY` — anti-clickjacking
- `Content-Security-Policy` — whitelist de origens
- `X-Content-Type-Options`, `Permissions-Policy`, `Cross-Origin-*`

**Rate Limiting (middleware):**
- Auth endpoints: **10 req/min por IP** (anti-brute-force)
- API geral: **100 req/min por usuário**
- IA: **20 req/min**

**Autenticação:**
- Senhas bcrypt (12 rounds)
- JWT em HttpOnly cookies (inacessível por JS)
- Timing attack mitigation no login
- Refresh token com rotação automática

**Dados:**
- Validação Zod em todas as rotas
- Queries Prisma parametrizadas (anti-SQL injection)
- Logs com redação automática de campos sensíveis
- Isolamento por `userId` em todas as queries

---

## Autenticação

```
Login → Access Token (15 min) + Refresh Token (30 dias)
Access Token expira → POST /api/auth/refresh → Novos tokens (rotação)
Refresh Token expira → Redirect para /login
```

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Cadastro + e-mail de boas-vindas |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Usuário logado |
| `/api/auth/refresh` | POST | Renovar access token |
| `/api/auth/change-password` | POST | Alterar senha |
| `/api/auth/forgot-password` | POST | Enviar e-mail de reset |
| `/api/auth/reset-password` | POST | Confirmar reset |

---

## Monitoramento

### Sentry

Configure `NEXT_PUBLIC_SENTRY_DSN` para ativar automaticamente:
- Captura de erros de browser e servidor
- Session Replay (10% das sessões)
- Performance monitoring

### Healthcheck

```bash
curl https://seuapp.vercel.app/api/health
# { "status": "healthy", "checks": { "database": "ok" }, ... }
```

---

## Backup e Restore

```bash
# Criar backup
make backup
# Saída: ./backups/personal_hub_20240610_120000.sql.gz

# Restaurar
make restore FILE=./backups/personal_hub_20240610_120000.sql.gz

# Cron diário às 2h
0 2 * * * cd /projeto && ./scripts/backup.sh
```

---

## Scripts Disponíveis

```bash
make help             # Lista todos os comandos disponíveis

make dev              # Servidor de desenvolvimento
make build            # Build de produção
make lint             # ESLint
make type-check       # TypeScript check
make format           # Prettier

make db-migrate-dev   # Criar migration em desenvolvimento
make db-migrate       # Aplicar migrations em produção
make db-seed          # Dados de exemplo
make db-studio        # Prisma Studio

make deploy           # Preview Vercel
make deploy-prod      # Produção Vercel

make backup           # Backup do banco
make restore FILE=... # Restaurar backup
make analyze          # Analisar bundle
```

---

## Como Adicionar Novas Funcionalidades

### Novo módulo

```bash
# 1. Página
mkdir -p src/app/(dashboard)/novo-modulo
touch src/app/(dashboard)/novo-modulo/page.tsx

# 2. API
mkdir -p src/app/api/novo-modulo
touch src/app/api/novo-modulo/route.ts

# 3. Adicionar ao sidebar.tsx, api.ts e types/index.ts
```

### Nova entidade no banco

```bash
# 1. Edite prisma/schema.prisma
# 2. Crie a migration
npx prisma migrate dev --name add-nova-entidade
# 3. Adicione os tipos em src/types/index.ts
```

### Boas práticas

- Use `createLogger(context)` para logs contextuais
- Use `ok()` / `error()` de `src/lib/api-response.ts` nas rotas
- Sempre valide inputs com Zod
- Sempre filtre por `userId` nas queries Prisma

---

## Checklist de Produção

- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` com 32+ chars aleatórios
- [ ] `DATABASE_URL` aponta para banco de produção
- [ ] `NODE_ENV=production` na Vercel
- [ ] Domínio com HTTPS ativado
- [ ] Sentry configurado
- [ ] Backup automático agendado
- [ ] `MAINTENANCE_MODE=false`
- [ ] CSP headers revisados para seu domínio

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          Login, Register, Forgot/Reset Password
│   ├── (dashboard)/     9 módulos (Rotina, Hábitos, Metas, Estudos, Finanças, Calendário, Projetos, IA, Settings)
│   ├── api/             Todas as rotas de API
│   ├── error.tsx        Página de erro com Sentry
│   ├── not-found.tsx    Página 404
│   ├── loading.tsx      Loading state global
│   ├── maintenance/     Modo manutenção
│   └── offline/         Página sem internet
├── components/
│   ├── layout/          Sidebar, Header, DashboardShell
│   └── ui/              Skeleton, componentes reutilizáveis
├── lib/
│   ├── auth.ts          JWT + bcrypt + refresh tokens
│   ├── api-response.ts  Respostas padronizadas
│   ├── email.ts         Templates de e-mail (Resend)
│   ├── logger.ts        Pino logger estruturado
│   ├── prisma.ts        Singleton Prisma
│   └── rate-limit.ts    Rate limiting LRU
├── middleware.ts         Auth + rate limit + manutenção
├── services/api.ts       Axios client
├── types/index.ts        TypeScript types
└── utils/helpers.ts      Formatadores, helpers
```

*Personal Hub — Arquitetura profissional, código limpo, pronto para produção.*
