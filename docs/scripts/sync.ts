/**
 * Builds the guide pages from the repository's own documents, so the docs
 * site never drifts from them:
 *
 * - ARCHITECTURE_AND_INTEGRATIONS.md → src/content/docs/guide/*.md, one page
 *   per top-level section, with in-document links pointed at the right page;
 * - AGENTS.md → src/content/docs/conventions.md;
 * - .github/assets/*.png → public/screenshots/.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const docs = join(import.meta.dirname, "..");
const content = join(docs, "src", "content", "docs");
const base = process.env.DOCS_BASE ?? "/a-saas";

/** The guide's top-level sections, in order. */
const pages = [
  { heading: "Architecture at a glance", slug: "architecture" },
  {
    heading: "1. Create a project from the template",
    slug: "create-a-project",
  },
  {
    heading: "2. Supabase migrations and Row Level Security",
    slug: "database",
  },
  {
    heading: "3. Build, sync and release the iOS and Android apps",
    slug: "mobile-apps",
  },
  {
    heading: "4. Marketing tracking and payments",
    slug: "tracking-and-payments",
  },
  { heading: "5. Vercel environment variables", slug: "deployment" },
];

const FENCE = /^(```|~~~)/;
const HEADING = /^(#{2,6}) (.+)$/;
const ANCHOR_LINK = /\]\(#([^)]+)\)/g;
const MERMAID = /```mermaid\n([\s\S]*?)```/g;
const NOT_SLUG = /[^\p{L}\p{N}\s_-]/gu;
const SPACE = /\s/g;
const TRAILING_RULE = /\n---\s*$/;
const SECTION_NUMBER = /^\d+\. /;
const H1 = /^# .*\n/;

/** GitHub's heading ids (github-slugger), which Starlight uses too. */
const slugify = (heading: string) =>
  heading.toLowerCase().replace(NOT_SLUG, "").replace(SPACE, "-");

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const frontmatter = (title: string, description: string) =>
  `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n\n`;

const syncGuide = async () => {
  const guide = await readFile(
    join(root, "ARCHITECTURE_AND_INTEGRATIONS.md"),
    "utf8"
  );
  const sections = new Map<string, string[]>();
  const anchors = new Map<string, string>();
  let current: string | undefined;
  let inFence = false;

  for (const line of guide.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
    }
    const heading = inFence ? null : HEADING.exec(line);
    if (heading?.[1] === "##") {
      const page = pages.find((p) => p.heading === heading[2]);
      if (!page) {
        throw new Error(`No docs page for guide section "${heading[2]}"`);
      }
      current = page.slug;
      sections.set(current, []);
      anchors.set(slugify(heading[2] as string), `${current}/`);
      continue;
    }
    if (!current) {
      continue; // The guide's own introduction and table of contents.
    }
    if (heading) {
      anchors.set(
        slugify(heading[2] as string),
        `${current}/#${slugify(heading[2] as string)}`
      );
    }
    // Each page's sections become its top-level headings.
    sections.get(current)?.push(heading ? line.slice(1) : line);
  }

  await rm(join(content, "guide"), { force: true, recursive: true });
  await mkdir(join(content, "guide"), { recursive: true });

  const writes = pages.map((page, index) => {
    const body = (sections.get(page.slug) ?? [])
      .join("\n")
      .replace(TRAILING_RULE, "\n")
      .replace(ANCHOR_LINK, (match, anchor: string) => {
        const target = anchors.get(anchor);
        return target ? `](${base}/guide/${target})` : match;
      })
      .replace(
        MERMAID,
        (_, diagram: string) =>
          `<pre class="mermaid">\n${escapeHtml(diagram)}</pre>\n`
      );
    const title = page.heading.replace(SECTION_NUMBER, "");
    const md = `${frontmatter(
      title,
      `A-SAAS guide: ${title.toLowerCase()}.`
    ).replace(
      "---\n\n",
      `sidebar:\n  order: ${index}\n---\n\n`
    )}${body.trim()}\n`;
    return writeFile(join(content, "guide", `${page.slug}.md`), md);
  });
  await Promise.all(writes);
};

const syncConventions = async () => {
  const agents = await readFile(join(root, "AGENTS.md"), "utf8");
  // Drop the H1 and any blocks tools append below the conventions.
  const body = agents.replace(H1, "").split("\n# ")[0]?.trim();
  await writeFile(
    join(content, "conventions.md"),
    `${frontmatter("Conventions", "Rules for anyone, human or AI agent, changing an A-SAAS codebase.")}${body}\n`
  );
};

const syncScreenshots = async () => {
  await rm(join(docs, "public", "screenshots"), {
    force: true,
    recursive: true,
  });
  await cp(
    join(root, ".github", "assets"),
    join(docs, "public", "screenshots"),
    {
      recursive: true,
    }
  );
};

await Promise.all([syncGuide(), syncConventions(), syncScreenshots()]);
console.log("Synced the guide, conventions and screenshots.");
