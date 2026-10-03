import fs from "node:fs";
import { blog, legal } from "@repo/cms";
import type { MetadataRoute } from "next";
import { env } from "@/env";

const appFolders = fs.readdirSync("app", { withFileTypes: true });
const pages = appFolders
  .filter((file) => file.isDirectory())
  .filter((folder) => !folder.name.startsWith("_"))
  .filter((folder) => !folder.name.startsWith("("))
  .map((folder) => folder.name);
// <module:cms>
const blogs = (await blog.getPosts()).map((post) => post._slug);
const legals = (await legal.getPosts()).map((post) => post._slug);
// </module:cms>
const protocol = env.VERCEL_PROJECT_PRODUCTION_URL?.startsWith("https")
  ? "https"
  : "http";
const url = new URL(`${protocol}://${env.VERCEL_PROJECT_PRODUCTION_URL}`);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  {
    lastModified: new Date(),
    url: new URL("/", url).href,
  },
  ...pages.map((page) => ({
    lastModified: new Date(),
    url: new URL(page, url).href,
  })),
  // <module:cms>
  ...blogs.map((slug) => ({
    lastModified: new Date(),
    url: new URL(`blog/${slug}`, url).href,
  })),
  ...legals.map((slug) => ({
    lastModified: new Date(),
    url: new URL(`legal/${slug}`, url).href,
  })),
  // </module:cms>
];

export default sitemap;
