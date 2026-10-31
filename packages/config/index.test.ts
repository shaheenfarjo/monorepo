import { describe, expect, test } from "vitest";
import { isPlaceholder, project } from "./index";

describe("project config", () => {
  test("detects template placeholders", () => {
    // Built at runtime so `bun run init` doesn't fill it in.
    const token = ["{{", "PROJECT_NAME", "}}"].join("");
    expect(isPlaceholder(token)).toBe(true);
    expect(isPlaceholder("Acme")).toBe(false);
    expect(isPlaceholder("{{ not a token }}")).toBe(false);
  });

  test("parses and keeps the default locale enabled", () => {
    expect(project.locale.enabled).toContain(project.locale.default);
  });

  test("regional settings are valid for Intl", () => {
    const { country, currency, timeZone } = project.region;
    expect(() => new Intl.DateTimeFormat("en", { timeZone })).not.toThrow();
    expect(
      () => new Intl.NumberFormat("en", { currency, style: "currency" })
    ).not.toThrow();
    expect(
      new Intl.DisplayNames("en", { type: "region" }).of(country)
    ).not.toBe(country);
  });

  test("functional fields are undefined or valid, never a raw token", () => {
    for (const value of [project.url, project.supportEmail, project.bundleId]) {
      if (value !== undefined) {
        expect(isPlaceholder(value)).toBe(false);
      }
    }
  });
});
