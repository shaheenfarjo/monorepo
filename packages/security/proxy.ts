import {
  defaults,
  nosecone,
  type Options,
  withVercelToolbar,
} from "@nosecone/next";
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

/**
 * Adds Nosecone's security headers to an existing proxy response (for example
 * one that carries refreshed auth cookies or an i18n rewrite) instead of
 * replacing it.
 */
export const withSecurityHeaders = <T extends Response>(
  response: T,
  options: Options = noseconeOptions
): T => {
  for (const [name, value] of nosecone(options)) {
    response.headers.set(name, value);
  }

  return response;
};
