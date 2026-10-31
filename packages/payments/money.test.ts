import { describe, expect, test } from "vitest";
import { currencyDigits, toMajorUnits, toMinorUnits } from "./money";

describe("money", () => {
  test.each([
    ["IQD", 0],
    ["SAR", 2],
    ["AED", 2],
    ["EGP", 2],
    ["JOD", 3],
  ])("%s has %i decimals", (currency, digits) => {
    expect(currencyDigits(currency)).toBe(digits);
  });

  test("converts between minor and whole units", () => {
    expect(toMajorUnits(25_000, "IQD")).toBe(25_000);
    expect(toMajorUnits(4900, "SAR")).toBe(49);
    expect(toMajorUnits(9000, "JOD")).toBe(9);
    expect(toMinorUnits(49.99, "SAR")).toBe(4999);
  });
});
