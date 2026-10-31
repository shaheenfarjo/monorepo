import { describe, expect, test } from "vitest";
import { formatPhone, normalizePhone, toWesternDigits } from "./phone";

describe("phone numbers", () => {
  test("converts Arabic-Indic and Persian digits", () => {
    expect(toWesternDigits("٠٧٧٠١٢٣٤٥٦٧")).toBe("07701234567");
    expect(toWesternDigits("۰۷۵۰")).toBe("0750");
  });

  test.each([
    ["0770 123 4567"],
    ["07701234567"],
    ["٠٧٧٠١٢٣٤٥٦٧"],
    ["+964 770 123 4567"],
    ["00964 770 123 4567"],
    ["964 770 123 4567"],
  ])("normalizes %s to E.164 (Iraq as the local country)", (input) => {
    expect(normalizePhone(input, "IQ")).toBe("+9647701234567");
  });

  test("rejects invalid numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("not a phone")).toBeNull();
  });

  test("accepts other countries when given with a country code", () => {
    expect(normalizePhone("+971 50 123 4567")).toBe("+971501234567");
  });

  test.each([
    ["SA", "050 123 4567", "+966501234567"],
    ["AE", "050 123 4567", "+971501234567"],
    ["EG", "0100 123 4567", "+201001234567"],
    ["JO", "079 123 4567", "+962791234567"],
  ] as const)("reads local %s numbers", (country, input, e164) => {
    expect(normalizePhone(input, country)).toBe(e164);
  });

  test("formats numbers for display", () => {
    expect(formatPhone("+9647701234567")).toBe("+964 770 123 4567");
    expect(formatPhone("9647701234567", "national")).toBe("0770 123 4567");
  });
});
