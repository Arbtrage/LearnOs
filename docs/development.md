# Local development

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL (Neon recommended for parity with production)
- Python 3.12+ (only if running evals locally)

## First-time setup

```bash
git clone <repo-url> learnos && cd learnos
cp .env.example .env
pnpm install
pnpm run db:push
```

Fill in `.env` before starting the app.

### Required variables

| Variable | How to get it |
| --- | --- |
| `DATABASE_URL` | [Neon](https://neon.tech) project → Connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 client; redirect URI `http://localhost:3000/api/auth/callback/google` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

### Optional variables

| Variable | Purpose |
| --- | --- |
| `GOOGLE_GENERATIVE_AI_MODEL` | Override default Gemini model (`gemini-3.5-flash-lite`) |
| `AI_GENERATION_ENABLED=1` | Feature flag; omit to disable AI calls in some environments |
| `RESOURCE_DISCOVERY_ENABLED=1` | Enable Gemini Google Search grounding for resource discovery |
| `MEM0_API_KEY` | Mem0 Platform — learner memory across sessions ([ai-platform.md](ai-platform.md)) |
| `DATABRICKS_*` / `MLFLOW_*` | MLflow tracing ([databricks-setup.md](databricks-setup.md)) |
| `CRON_SECRET` | Secures `/api/cron/*` endpoints locally and in CI |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |

## Running the app

Terminal 1 — Next.js:

```bash
pnpm run dev
```

Terminal 2 — Inngest (required for background AI generation):

```bash
pnpm run dev:inngest
```

Without Inngest, blueprint/lesson/question/mock-exam generation will queue but not execute. The Inngest dev UI is at [http://localhost:8288](http://localhost:8288).

On Vercel, the Inngest integration sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` automatically. Local dev does not need them.

## Database

```bash
pnpm run db:migrate    # apply migration files (preferred for shared schema changes)
pnpm run db:push       # push schema directly (fast for solo dev)
pnpm run db:studio     # visual browser for rows
```

After pulling schema changes, always run `pnpm exec prisma generate` (also runs on `pnpm install` via `postinstall`).

## Lint and build

```bash
pnpm run lint
pnpm run build
```

## Eval harness (optional)

Evals live in `evals/` and are separate from the Next app. See [evals/README.md](../evals/README.md).

```bash
pnpm install && pnpm exec prisma generate   # invariant bridge needs the app deps
cd evals && pip install -e ".[dev]"
python -m learnos_evals.run --all --no-judges   # free, no Databricks, no judge LLM calls
pytest tests -q
```

## Common issues

**Generation stuck at "Generating…"** — Inngest dev server not running. Start `pnpm run dev:inngest`.

**Prisma client out of date** — Run `pnpm exec prisma generate` after schema changes.

**Gemini quota errors** — Check model name in `.env`. Avoid `gemini-2.0-flash` on free tier (quota limit is 0). The app falls back through newer flash models automatically when configured.

**Mock exam / practice quality check failed** — The AI kernel validates and retries generation. Check Inngest logs for the underlying validation message.
