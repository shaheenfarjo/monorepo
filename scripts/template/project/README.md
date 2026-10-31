# {{PROJECT_NAME}}

{{ORG_NAME}}'s production monorepo: a Next.js + Supabase SaaS platform for
Arabic-first products, created from the [A-SAAS](https://github.com/theideaiq/a-saas)
template. It ships Arabic (RTL) and English (LTR), takes payments through Wayl or
Stripe, and can be packaged as native iOS and Android apps.

## Stack

| Concern | Choice |
| --- | --- |
| Monorepo | Turborepo + Bun workspaces |
| Web apps | Next.js (App Router), React, Tailwind CSS v4, shadcn/ui |
| Auth & database | Supabase (Postgres, Row Level Security, phone OTP) |
| Payments | Provider-agnostic `@repo/payments` with Wayl (Iraq) and Stripe |
| Localization | Arabic + English, RTL-aware design system, regional dates, currency and phone numbers |
| Mobile | Capacitor (iOS + Android) from the same `apps/app` codebase |
| Analytics | GTM, GA4, Meta Pixel, TikTok Pixel, server-side conversions |
| Hosting | Vercel (apps) + Cloudflare (DNS, Turnstile, R2) |
| Quality | Biome via Ultracite, TypeScript strict, Vitest, GitHub Actions |

## Structure

```
apps/
  web/        Marketing site (port 3001)
  app/        Main product — web + iOS/Android via Capacitor (port 3000)
  api/        Webhooks, cron jobs and server-only endpoints (port 3002)
  email/      React Email templates (port 3003)
  docs/       Mintlify documentation (port 3004)
  storybook/  Design-system workbench (port 6006)
packages/
  config/     Project identity, locales and regional settings (single source of truth)
  auth/       Supabase Auth clients, phone OTP, session middleware
  database/   Supabase schema, migrations, RLS tests and generated types
  payments/   Payment-provider interface, Wayl and Stripe providers, billing logic
  design-system/, internationalization/, analytics/, security/, seo/, …
scripts/      Repository checks
```

## Getting started

Prerequisites: Node.js 22+, [Bun](https://bun.sh), and Docker if you want to run
Supabase locally.

```sh
bun install
bun run dev       # starts every app
```

Each app reads its environment from `.env.local` (created by `init` from the
`.env.example` files). Without credentials the apps still start; integrations whose
keys are missing are disabled.

## Common scripts

| Script | What it does |
| --- | --- |
| `bun run dev` | Run all apps in development |
| `bun run build` | Build all apps |
| `bun run check` / `bun run fix` | Lint and format with Biome |
| `bun run typecheck` | Type-check every workspace |
| `bun run test` | Run all unit tests |
| `bun run check:placeholders` | Fail if placeholder tokens remain after init |
| `bun run check:rtl` / `bun run check:i18n` | Physical Tailwind utilities / UI text missing from the messages files |
| `bun run db:start` / `db:reset` / `db:test` / `db:types` | Local Supabase, migrations, RLS tests, generated types |
| `bun run build:native` / `bun run cap:sync` | Static export of `apps/app` / copy it into the iOS and Android projects |

## Further reading

- `ARCHITECTURE_AND_INTEGRATIONS.md` — how the apps fit together, and step-by-step
  setup for the template generator, Supabase migrations and RLS, the Capacitor apps,
  tracking, payments and Vercel environment variables
- `AGENTS.md` — conventions for humans and AI agents
- `.github/CONTRIBUTING.md` — workflow and local checks
- `THIRD_PARTY_NOTICES.md` — licenses of included open-source code

Repository: {{REPO_URL}} · Support: {{SUPPORT_EMAIL}}
