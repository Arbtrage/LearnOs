# LearnOS

AI-powered learning operating system — plan a curriculum, study with an AI mentor, practice with generated questions, revise with spaced repetition, and sit mock exams before the real thing.

## Stack

| Layer | Technology |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Auth | NextAuth.js (credentials + Google OAuth) |
| Data | Prisma ORM + Neon PostgreSQL |
| AI | Vercel AI SDK + Google Gemini |
| Jobs | Inngest (durable generation, realtime progress) |
| Memory | Mem0 Platform (optional learner context) |
| Observability | `AiRun` audit log + MLflow tracing on Databricks (optional) |
| Evals | Python MLflow harness in [`evals/`](evals/) |

## Quick start

```bash
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, Google OAuth, and Gemini key — see docs/development.md

pnpm install
pnpm run db:push
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Background AI generation (lessons, questions, mock exams) runs through Inngest. In a second terminal:

```bash
pnpm run dev:inngest
```

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/development.md](docs/development.md) | Local setup, env vars, Inngest, database |
| [docs/ai-platform.md](docs/ai-platform.md) | AI kernel, jobs, memory, tracing, evals |
| [docs/databricks-setup.md](docs/databricks-setup.md) | Free-tier MLflow tracing and eval logging |
| [docs/deployment.md](docs/deployment.md) | Vercel, GitHub Actions, cron secrets |
| [evals/README.md](evals/README.md) | Offline GenAI evaluation harness |

Phase implementation specs live under [`docs/Phase*.md`](docs/) (historical product specs).

## Project structure

```
app/                    Next.js routes (marketing, auth, dashboard, workspace)
features/               Feature UI (marketing, workspace sections)
lib/ai/kernel/          Task registry, runAiTask, validation, tracing hooks
lib/jobs/               Inngest functions, realtime channels
server/                 Services, repositories, domain logic
evals/                  Python MLflow eval harness + golden datasets
prisma/                 Schema and migrations
scripts/                CLI utilities (eval invariant bridge)
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm run dev` | Next.js dev server (runs `prisma generate` first) |
| `pnpm run dev:inngest` | Local Inngest dev server for background jobs |
| `pnpm run build` | Production build |
| `pnpm run db:migrate` | Run Prisma migrations |
| `pnpm run db:push` | Push schema without migration files |
| `pnpm run db:studio` | Open Prisma Studio |
| `pnpm run eval:invariants` | Run the Node invariant bridge (used by evals) |

## Environment variables

Required for core app functionality:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `GOOGLE_GENERATIVE_AI_MODEL` — optional; defaults to `gemini-3.5-flash-lite`

Optional integrations (app works without them):

- **Inngest** — auto-configured on Vercel; local dev uses `pnpm dev:inngest`
- **Mem0** — `MEM0_API_KEY` for cross-session learner memory
- **MLflow / Databricks** — tracing and eval experiment logging ([setup guide](docs/databricks-setup.md))
- **Cron** — `CRON_SECRET` + `LEARNOS_APP_URL` for scheduled jobs and eval export

See [`.env.example`](.env.example) and [docs/development.md](docs/development.md) for the full list.

## License

Private — not for redistribution.
