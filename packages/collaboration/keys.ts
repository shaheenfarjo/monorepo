import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    // Treat KEY="" (as in .env.example) as unset.
    emptyStringAsUndefined: true,
    runtimeEnv: {
      LIVEBLOCKS_SECRET: process.env.LIVEBLOCKS_SECRET,
    },
    server: {
      LIVEBLOCKS_SECRET: z.string().startsWith("sk_").optional(),
    },
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  });
