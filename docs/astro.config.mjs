import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const repo = "https://github.com/theideaiq/a-saas";
// GitHub Pages serves the site under /a-saas; override for a custom domain.
const site = process.env.DOCS_SITE ?? "https://theideaiq.github.io";
const base = process.env.DOCS_BASE ?? "/a-saas";

export default defineConfig({
  base,
  integrations: [
    starlight({
      components: { Head: "./src/components/head.astro" },
      defaultLocale: "root",
      editLink: { baseUrl: `${repo}/edit/main/docs/` },
      favicon: "/favicon.svg",
      locales: {
        ar: { dir: "rtl", label: "العربية", lang: "ar" },
        root: { label: "English", lang: "en" },
      },
      sidebar: [
        {
          items: ["quickstart", "conventions"],
          label: "Start here",
          translations: { ar: "ابدأ هنا" },
        },
        {
          items: [{ autogenerate: { directory: "guide" } }],
          label: "Guide",
          translations: { ar: "الدليل" },
        },
      ],
      social: [{ href: repo, icon: "github", label: "GitHub" }],
      title: { ar: "أساس", en: "A-SAAS" },
    }),
  ],
  site,
});
