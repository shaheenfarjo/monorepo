import { defaults, type Options, withVercelToolbar } from "@nosecone/next";
import {
  createContentSecurityPolicy,
  defaultCspSources,
  supabaseCspSources,
} from "./csp";

export { createMiddleware as securityMiddleware } from "@nosecone/next";

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: Options = {
  ...defaults,
  contentSecurityPolicy: createContentSecurityPolicy(
    {},
    defaultCspSources,
    supabaseCspSources(process.env.NEXT_PUBLIC_SUPABASE_URL)
  ),
  // `require-corp` blocks third-party images, pixels and iframes that do not
  // send a Cross-Origin-Resource-Policy header (most analytics endpoints).
  crossOriginEmbedderPolicy: false,
  // Keeps the origin on cross-site requests so analytics attribution works,
  // without leaking full URLs (paths, query strings) to third parties.
  referrerPolicy: { policy: ["strict-origin-when-cross-origin"] },
};

export const noseconeOptionsWithToolbar: Options =
  withVercelToolbar(noseconeOptions);
