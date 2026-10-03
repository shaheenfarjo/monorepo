import { updateSession } from "@repo/auth/proxy";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  withSecurityHeaders,
} from "@repo/security/proxy";
import type { NextRequest } from "next/server";
import { env } from "./env";

const securityOptions = env.FLAGS_SECRET
  ? noseconeOptionsWithToolbar
  : noseconeOptions;

export default async function proxy(request: NextRequest) {
  const response = await updateSession(request, {
    // Route handlers authenticate requests themselves and answer with 401
    // instead of a redirect.
    publicPaths: ["/sign-in", "/sign-up", "/auth", "/api", "/.well-known"],
  });

  return withSecurityHeaders(response, securityOptions);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
