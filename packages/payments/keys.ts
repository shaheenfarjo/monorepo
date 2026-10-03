import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    runtimeEnv: {
      WAYL_API_TOKEN: process.env.WAYL_API_TOKEN,
      WAYL_WEBHOOK_SECRET: process.env.WAYL_WEBHOOK_SECRET,
    },
    server: {
      WAYL_API_TOKEN: z.string().optional(),
      WAYL_WEBHOOK_SECRET: z.string().optional(),
    },
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  });
