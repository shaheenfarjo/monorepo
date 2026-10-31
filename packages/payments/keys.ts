import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Secret (sk_) or restricted (rk_) keys, live or test.
const STRIPE_KEY = /^(sk|rk)_(live|test)_/;

export const keys = () =>
  createEnv({
    // Treat KEY="" (as in .env.example) as unset.
    emptyStringAsUndefined: true,
    runtimeEnv: {
      PAYMENTS_PROVIDER: process.env.PAYMENTS_PROVIDER,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      WAYL_API_TOKEN: process.env.WAYL_API_TOKEN,
      WAYL_API_URL: process.env.WAYL_API_URL,
      WAYL_ENV: process.env.WAYL_ENV,
      WAYL_WEBHOOK_SECRET: process.env.WAYL_WEBHOOK_SECRET,
    },
    server: {
      /**
       * Defaults to wayl when WAYL_API_TOKEN is set, else stripe when
       * STRIPE_SECRET_KEY is set, otherwise mock (development only).
       */
      PAYMENTS_PROVIDER: z.enum(["wayl", "stripe", "mock"]).optional(),
      STRIPE_SECRET_KEY: z.string().regex(STRIPE_KEY).optional(),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
      WAYL_API_TOKEN: z.string().min(1).optional(),
      /** Override for Wayl's staging server (https://api.thewayl-staging.com). */
      WAYL_API_URL: z.url().optional(),
      WAYL_ENV: z.enum(["live", "test"]).default("live"),
      WAYL_WEBHOOK_SECRET: z.string().min(10).max(255).optional(),
    },
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  });
