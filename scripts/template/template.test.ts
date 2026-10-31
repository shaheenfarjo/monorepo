import { describe, expect, test } from "vitest";
import { MarkerError, stripModuleBlocks } from "./markers";
import {
  deriveBundleId,
  findTokens,
  replaceTokens,
  slugify,
  tokenValues,
  validate,
} from "./tokens";

const answers = {
  bundleId: "iq.example.nakhla",
  orgName: "شركة النخلة",
  orgSlug: "nakhla-trading",
  projectName: "Nakhla",
  projectSlug: "nakhla",
  projectUrl: "https://nakhla.example.iq",
  repoUrl: "https://github.com/acme/nakhla",
  supportEmail: "support@example.iq",
  year: 2026,
};

describe("tokens", () => {
  test("replaces known tokens and leaves others alone", () => {
    // An unknown token, built at runtime so the placeholder check ignores it.
    const other = ["{{", "OTHER", "}}"].join("");
    const input = `{{PROJECT_NAME}} by {{ORG_NAME}} © {{YEAR}} ${other} {{ name }}`;
    expect(replaceTokens(input, tokenValues(answers))).toBe(
      `Nakhla by شركة النخلة © 2026 ${other} {{ name }}`
    );
  });

  test("finds tokens but not Handlebars expressions", () => {
    expect(findTokens('{{ORG_SLUG}} "@repo/{{ name }}"')).toEqual(["ORG_SLUG"]);
  });

  test("slugifies names", () => {
    expect(slugify("Nakhla 24 — Erbil!")).toBe("nakhla-24-erbil");
    expect(slugify("شركة")).toBe("");
  });

  test("derives a valid reverse-DNS bundle id", () => {
    const id = deriveBundleId("https://www.24-nakhla.iq", "nakhla-app");
    expect(id).toBe("iq.app24nakhla.nakhlaapp");
    expect(validate.bundleId(id)).toBeUndefined();
  });

  test("validates inputs", () => {
    expect(validate.slug("my-app")).toBeUndefined();
    expect(validate.slug("My App")).toBeDefined();
    expect(validate.url("example.iq")).toBeDefined();
    expect(validate.email("a@b.iq")).toBeUndefined();
    expect(validate.bundleId("com.example.my-app")).toBeDefined();
  });
});

describe("module markers", () => {
  const source = [
    "const extensions = [",
    "  core(),",
    "  // <module:cms>",
    "  cms(),",
    "  // </module:cms>",
    "  // <module:flags>",
    "  flags(),",
    "  // </module:flags>",
    "];",
    "{/* <module:cms> */}",
    "<Toolbar />",
    "{/* </module:cms> */}",
    "# <module:cms>",
    'BASEHUB_TOKEN=""',
    "# </module:cms>",
  ].join("\n");

  test("removes blocks of removed modules and markers of kept ones", () => {
    const { content, modules } = stripModuleBlocks(source, new Set(["cms"]));
    expect(content).toBe(
      ["const extensions = [", "  core(),", "  flags(),", "];"].join("\n")
    );
    expect([...modules].sort()).toEqual(["cms", "flags"]);
  });

  test("keeps everything when nothing is removed", () => {
    const { content } = stripModuleBlocks(source, new Set());
    expect(content).toContain("cms(),");
    expect(content).toContain("<Toolbar />");
    expect(content).not.toContain("<module:");
  });

  test("supports nested blocks", () => {
    const nested = [
      "// <module:a>",
      "a",
      "// <module:b>",
      "b",
      "// </module:b>",
      "// </module:a>",
      "c",
    ].join("\n");
    expect(stripModuleBlocks(nested, new Set(["b"])).content).toBe("a\nc");
    expect(stripModuleBlocks(nested, new Set(["a"])).content).toBe("c");
  });

  test("rejects unbalanced markers", () => {
    expect(() =>
      stripModuleBlocks("// <module:a>\nx\n// </module:b>", new Set())
    ).toThrow(MarkerError);
    expect(() => stripModuleBlocks("// <module:a>\nx", new Set())).toThrow(
      MarkerError
    );
  });
});

describe("region presets", () => {
  test("every replaced text still exists in its file", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { regionalReplacements, regionPresets } = await import("./regions");
    const root = join(import.meta.dirname, "../..");

    for (const [file, replacements] of Object.entries(
      regionalReplacements(regionPresets[1] as (typeof regionPresets)[number])
    )) {
      // biome-ignore lint/performance/noAwaitInLoops: two small files
      const content = await readFile(join(root, file), "utf8");
      for (const [from] of replacements) {
        expect(content, `${file}: ${from}`).toContain(from);
      }
    }
  });

  test("presets are valid for Intl and use the currency's minor unit", async () => {
    const { regionPresets } = await import("./regions");
    for (const preset of regionPresets) {
      expect(
        () => new Intl.DateTimeFormat("en", { timeZone: preset.timeZone })
      ).not.toThrow();
      const digits =
        new Intl.NumberFormat("en", {
          currency: preset.currency,
          style: "currency",
        }).resolvedOptions().maximumFractionDigits ?? 2;
      // Example prices are whole amounts of money.
      for (const price of preset.prices) {
        expect(price % 10 ** digits).toBe(0);
      }
    }
  });
});
