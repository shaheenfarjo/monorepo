import { updateSession } from "@repo/auth/proxy";
import { withSecurityHeaders } from "@repo/security/proxy";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const response = await updateSession(request, {
    // Route handlers authenticate requests themselves and answer with 401
    // instead of a redirect.
    publicPaths: ["/sign-in", "/sign-up", "/auth", "/api", "/.well-known"],
  });

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
