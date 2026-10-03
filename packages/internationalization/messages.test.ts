import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { locales } from "./config";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

const paths = (value: unknown, prefix = ""): string[] => {
  if (Array.isArray(value)) {
    return [
      `${prefix}[${value.length}]`,
      ...value.flatMap((item, index) => paths(item, `${prefix}[${index}]`)),
    ];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      paths(item, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
};

const PLACEHOLDER = /\{(\w+)\}/g;
const PATH_SEGMENT = /\.|\[(\d+)\]/;
const placeholders = (text: string) =>
  [...text.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();

describe("messages", () => {
  test("every enabled locale has a messages file", () => {
    for (const locale of locales) {
      expect(
        existsSync(new URL(`./messages/${locale}.json`, import.meta.url)),
        `messages/${locale}.json is missing; add it before enabling ${locale}`
      ).toBe(true);
    }
  });

  test("Arabic has exactly the same keys as English", () => {
    expect(paths(ar).sort()).toEqual(paths(en).sort());
  });

  test("translations keep every {placeholder}", () => {
    const lookup = (source: unknown, path: string) =>
      path
        .split(PATH_SEGMENT)
        .filter(Boolean)
        .reduce<unknown>(
          (node, key) => (node as Record<string, unknown> | undefined)?.[key],
          source
        );

    for (const path of paths(en)) {
      const english = lookup(en, path);
      if (typeof english === "string") {
        expect(placeholders(lookup(ar, path) as string), path).toEqual(
          placeholders(english)
        );
      }
    }
  });
});
