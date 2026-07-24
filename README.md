# LearnOS

AI-powered learning operating system.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- NextAuth.js (credentials + Google OAuth)
- Prisma ORM + Neon PostgreSQL
- Vercel AI SDK + Google Gemini

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Fill in `.env`:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — run `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `GOOGLE_GENERATIVE_AI_MODEL` — optional, defaults to `gemini-2.5-flash` (do **not** use `gemini-2.0-flash` on free tier — its quota limit is 0)

3. Install dependencies and migrate:

```bash
pnpm install
pnpm run db:push
```

4. Start the dev server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### Phase 1

- Sign up / sign in (email + Google)
- Authenticated dashboard with project list
- Magical create project flow (`/projects/new`)
- Turn-by-turn AI onboarding interview (Gemini)
- Dark-first design system with theme toggle

### Phase 2

- Async AI blueprint generation after onboarding
- Project workspace at `/projects/[slug]` with dynamic DB-driven sidebar
- Overview dashboard with widget grid (mock metrics)
- Today timeline with mock tasks
- Resizable AI Mentor panel with streaming chat
- Project switcher and last-project cookie

## Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Project list and stats |
| `/projects/new` | Create project wizard |
| `/projects/[slug]/onboarding` | AI onboarding interview |
| `/projects/[slug]` | Workspace overview (dashboard widgets) |
| `/projects/[slug]/today` | Today's plan (mock tasks) |
| `/projects/[slug]/[section]` | Sidebar sections (placeholders) |

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects` | GET | List user projects |
| `/api/projects/[id]` | GET | Project + blueprint status |
| `/api/projects/[id]/blueprint/generate` | POST | Trigger blueprint generation |
| `/api/projects/[id]/sidebar` | GET | Sidebar items |
| `/api/projects/[id]/dashboard` | GET | Dashboard widgets + metrics |
| `/api/projects/[id]/mentor` | POST | Streaming mentor chat |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Development server |
| `pnpm run build` | Production build |
| `pnpm run db:generate` | Generate Prisma client |
| `pnpm run db:migrate` | Run migrations |
| `pnpm run db:push` | Push schema to database |
| `pnpm run db:studio` | Open Prisma Studio |
