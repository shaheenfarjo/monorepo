import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/keys";
import { keys as collaboration } from "@repo/collaboration/keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as notifications } from "@repo/notifications/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as security } from "@repo/security/keys";
import { keys as webhooks } from "@repo/webhooks/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  client: {},
  // Treat KEY="" (as in .env.example) as unset.
  emptyStringAsUndefined: true,
  extends: [
    auth(),
    analytics(),
    // <module:collaboration>
    collaboration(),
    // </module:collaboration>
    core(),
    database(),
    email(),
    // <module:feature-flags>
    flags(),
    // </module:feature-flags>
    // <module:notifications>
    notifications(),
    // </module:notifications>
    observability(),
    security(),
    // <module:webhooks>
    webhooks(),
    // </module:webhooks>
  ],
  runtimeEnv: {},
  server: {},
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
