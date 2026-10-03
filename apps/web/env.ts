import { keys as cms } from "@repo/cms/keys";
import { keys as email } from "@repo/email/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as rateLimit } from "@repo/rate-limit/keys";
import { keys as security } from "@repo/security/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  client: {},
  // Treat KEY="" (as in .env.example) as unset.
  emptyStringAsUndefined: true,
  extends: [
    // <module:cms>
    cms(),
    // </module:cms>
    core(),
    email(),
    observability(),
    // <module:feature-flags>
    flags(),
    // </module:feature-flags>
    security(),
    // <module:rate-limit>
    rateLimit(),
    // </module:rate-limit>
  ],
  runtimeEnv: {},
  server: {},
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
