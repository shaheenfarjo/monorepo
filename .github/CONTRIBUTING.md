# Contributing

## Workflow

1. Create a branch from the default branch: `git checkout -b feat/short-description`.
2. Make focused changes and keep pull requests small.
3. Run the checks below locally before pushing.
4. Open a pull request using the template and request a review.

## Local checks

```sh
bun run check       # Biome lint + format (Ultracite)
bun run typecheck   # TypeScript across all workspaces
bun run test        # Vitest across all workspaces
bun run check:rtl   # logical (RTL-safe) Tailwind utilities
```

## Conventions

- Code style is enforced by Biome; run `bun run fix` to apply safe fixes.
- UI must work in both Arabic (RTL) and English (LTR). Use logical Tailwind
  utilities (`ms-*`, `pe-*`, `start-*`, `text-start`) instead of physical ones
  (`ml-*`, `pr-*`, `left-*`, `text-left`).
- Never authorize with `user_metadata`; it is editable by the user.
- Database changes go through migrations and need RLS policies plus tests.

See `AGENTS.md` for the architecture overview.
