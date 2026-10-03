import { withCMS } from "@repo/cms/next-config";
import { withToolbar } from "@repo/feature-flags/lib/toolbar";
import { config, withAnalyzer } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = withLogging(config);

// <module:feature-flags>
nextConfig = withToolbar(nextConfig);
// </module:feature-flags>

// <module:cms>
nextConfig = withCMS(nextConfig);
nextConfig.images?.remotePatterns?.push({
  hostname: "assets.basehub.com",
  protocol: "https",
});
// </module:cms>

if (process.env.NODE_ENV === "production") {
  const redirects: NextConfig["redirects"] = async () => [
    {
      destination: "/legal/privacy",
      source: "/legal",
      statusCode: 301,
    },
  ];

  nextConfig.redirects = redirects;
}

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
