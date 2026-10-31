---
title: Quick start
description: Create a project from A-SAAS and run it locally.
---

You need [Bun](https://bun.sh) and, for the local database,
[Docker](https://docs.docker.com/get-docker/).

## 1. Create the project

```sh
bun create theideaiq/a-saas my-product
cd my-product
```

`bun create` copies the template, installs dependencies and starts a fresh
Git history. GitHub's **Use this template** button or `git clone` followed by
`bun install` work too.

## 2. Make it yours

```sh
bun run init
```

The generator asks for your organization and project names, country, default
language, license and the optional modules to keep. It then rewrites the
codebase and creates the `.env.local` files. The
[generator reference](../guide/create-a-project/#12-run-the-generator) lists
every flag for scripted setups.

| Country preset | Currency | Payments to start with |
| --- | --- | --- |
| `IQ` Iraq | IQD | Wayl |
| `SA` Saudi Arabia | SAR | Stripe, if available to you |
| `AE` UAE | AED | Stripe |
| `EG` Egypt | EGP | Stripe, if available to you |
| `JO` Jordan | JOD | Stripe, if available to you |

## 3. Run it

```sh
bun run db:start    # local Supabase (Docker); prints the URL and keys
bun run dev         # app :3000 · site :3001 · api :3002
```

Put the URL and keys from `db:start` into the `.env.local` files, then open
`http://localhost:3000` and sign in with `+964 770 000 0000` and the code
`123456`.

## Next steps

- [Architecture at a glance](../guide/architecture/): how the apps, Supabase
  and the API fit together.
- [Database and Row Level Security](../guide/database/): change the schema
  safely.
- [Mobile apps](../guide/mobile-apps/): build and release for iOS and
  Android.
- [Tracking and payments](../guide/tracking-and-payments/): ad attribution,
  Wayl and Stripe.
- [Deployment](../guide/deployment/): Vercel projects and environment
  variables.
- [Conventions](../conventions/): the rules for humans and AI coding agents.
