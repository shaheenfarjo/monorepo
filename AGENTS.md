# Agent and contributor guide

Conventions for anyone — human or AI agent — changing this repository.

## Repository map

- `apps/web` — marketing site (Next.js, i18n routes under `app/[locale]`).
- `apps/app` — the product. Must stay buildable as a static export for the
  Capacitor iOS/Android apps: no server-only features in user-facing routes.
- `apps/api` — webhooks, cron jobs and privileged server endpoints.
- `apps/email`, `apps/docs`, `apps/storybook` — templates, docs, UI workbench.
- `packages/*` — shared code, imported as `@repo/<name>`. `@repo` is a fixed
  internal scope; never rename it per project.
- `packages/config/project.json` — the single source of truth for organization,
  project, locales, region and commerce settings. Read it through `@repo/config`.
- `scripts/` — `init.ts` creates a project from the template (template only);
  `check-placeholders.ts` guards against unfilled tokens.

## Commands

```sh
bun install
bun run dev                 # all apps
bun run check | fix         # Biome (Ultracite rules)
bun run typecheck           # every workspace
bun run test                # Vitest in every workspace
bun run check:placeholders
bun run gen:package         # scaffold packages/<name>
```

Run `check`, `typecheck` and `test` before every commit.

## Rules

- **Package manager:** Bun with the hoisted linker (`bunfig.toml`). Declare every
  dependency a package imports; keep versions aligned across workspaces.
- **Auth:** never authorize with `user_metadata` — users can edit it. Use the
  session-bound Supabase client (`@repo/auth/server`) for user requests so Row
  Level Security applies. The admin client (`@repo/database`) bypasses RLS and is
  only for webhooks, cron jobs and other trusted server code.
- **Database:** schema changes are migrations with RLS policies and tests.
- **Secrets:** never in client code, logs or commits. New env vars go in the
  package's `keys.ts` and every affected `.env.example`.
- **Payments:** in-app (native) checkout is controlled by
  `project.commerce.allowNativeCheckout`. Digital goods must not be sold
  through third-party checkout inside the iOS/Android apps.
- **Localization:** UI must work in Arabic (RTL) and English (LTR). Use logical
  Tailwind utilities (`ms-*`, `pe-*`, `start-*`, `text-start`), never physical
  ones (`ml-*`, `pr-*`, `left-*`, `text-left`). Dates default to `Asia/Baghdad`.
- **Optional modules:** code that belongs to an optional module (see
  `scripts/template/modules.ts`) is wrapped in `// <module:id>` …
  `// </module:id>` markers (`{/* … */}` in JSX, `#` in env files). Keep markers
  balanced; `bun run check:placeholders` verifies them.
- **Placeholders:** project-specific values use double-brace tokens such as the
  project name token in `README.md`. Only `bun run init` should replace them.
- **shadcn/ui:** files in `packages/design-system/components/ui` are generated;
  update them with the shadcn CLI rather than hand-editing where possible.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
