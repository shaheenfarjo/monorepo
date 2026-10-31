# Contributing

Thanks for helping build A-SAAS. Contributions that are especially welcome:
country presets (`scripts/template/regions.ts`), payment gateways
(`packages/payments/providers`), SMS providers for the Send SMS hook, and
translations.

## Workflow

1. Create a branch from the default branch: `git checkout -b feat/short-description`.
2. Make focused changes and keep pull requests small.
3. Run the checks below locally before pushing.
4. Open a pull request using the template and request a review.
5. Sign off your commits (`git commit -s`). This certifies the
   [Developer Certificate of Origin](https://developercertificate.org): you
   wrote the change or have the right to submit it under the MIT license.

## Local checks

```sh
bun run check       # Biome lint + format (Ultracite)
bun run typecheck   # TypeScript across all workspaces
bun run test        # Vitest across all workspaces
bun run check:rtl   # logical (RTL-safe) Tailwind utilities
bun run check:i18n  # no hard-coded UI text outside the messages files
bun run test:template   # the init generator (template repository only)
```

If you change `bun run init` or anything it rewrites, also try it on a copy:
`bun scripts/init.ts --root <copy> --yes …` (see
`.github/workflows/template.yml`).

## Conventions

- Code style is enforced by Biome; run `bun run fix` to apply safe fixes.
- UI must work in both Arabic (RTL) and English (LTR). Use logical Tailwind
  utilities (`ms-*`, `pe-*`, `start-*`, `text-start`) instead of physical ones
  (`ml-*`, `pr-*`, `left-*`, `text-left`).
- Never authorize with `user_metadata`; it is editable by the user.
- Database changes go through migrations and need RLS policies plus tests.

See `AGENTS.md` for the rules in short, and `ARCHITECTURE_AND_INTEGRATIONS.md`
for the architecture and how to set up each integration.
