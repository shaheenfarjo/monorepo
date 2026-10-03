import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    // Treat KEY="" (as in .env.example) as unset.
    emptyStringAsUndefined: true,
    runtimeEnv: {
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    },
    server: {
      BLOB_READ_WRITE_TOKEN: z.string().optional(),
    },
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  });
