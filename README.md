# Calvary Baptist Church Financial Management System

A private staff workspace for Calvary Baptist Church. Phase 1 delivers email/password sign-in, an authenticated dashboard shell, account details, and two database-enforced staff assignments. The financial modules follow in the [roadmap](docs/ROADMAP.md).

## Local setup
Install Node 22.23 or later in the 22.x series, pnpm 10.34.9, Git and Docker Desktop with Linux containers. From the repository root run:

```sh
pnpm install --frozen-lockfile
pnpm run db:start
node scripts/configure-local.mjs
pnpm build
pnpm start --port 3107
```

Open http://localhost:3107. The configure command creates a private local environment file and refuses to overwrite an existing one. The API uses port 55321 and PostgreSQL uses 55322. Keep this local development stack on a trusted machine. Use `pnpm exec supabase stop` from this repository to stop Calvary.

## Verify or explore
With the web server running, use a second terminal. Run `pnpm exec playwright install chromium` then `pnpm test:foundation` on a fresh stack with both slots empty. It creates ephemeral fictitious users, exercises real sign-in and RLS, and removes those users. Screenshots go to test-results. Run `pnpm lint` and `pnpm typecheck` for static checks.

After tests, run `node scripts/seed-local.mjs` to create two fictional accounts for manual use. Read their generated emails and passwords in the ignored .env.demo file. Never use these accounts outside the local stack. Signup is disabled. To work on the interface use `pnpm dev --port 3107` instead of the production server.

The app/ directory contains the App Router pages and server actions. lib/session.ts handles server-side access. supabase/migrations contains schema and authorization rules. CI repeats setup, build and browser verification on a fresh runner. Production deployment requires the later release gate.
