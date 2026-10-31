import { project } from "@repo/config";
import {
  type CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";

/** Local numbers (without a country code) are read as this country's. */
export const DEFAULT_PHONE_COUNTRY = project.region.country as CountryCode;

// Arabic-Indic (٠-٩) and Extended Arabic-Indic/Persian (۰-۹) digits, which
// Arabic and Kurdish keyboards produce.
const ARABIC_INDIC_DIGITS = /[٠-٩]/g;
const PERSIAN_DIGITS = /[۰-۹]/g;
const INTERNATIONAL_PREFIX = /^00/;

/** Converts Arabic-Indic and Persian digits to ASCII digits. */
export const toWesternDigits = (value: string) =>
  value
    .replace(ARABIC_INDIC_DIGITS, (digit) =>
      String(digit.charCodeAt(0) - 0x06_60)
    )
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06_f0));

/**
 * Normalizes user input to E.164. With Iraq as the project country,
 * "0770 123 4567", "٠٧٧٠١٢٣٤٥٦٧", "00964 770…" and "+964 770…" all become
 * "+9647701234567"; numbers with a country code work for any country.
 * Returns null when the number is not valid.
 */
export const normalizePhone = (
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null => {
  const western = toWesternDigits(input)
    .trim()
    .replace(INTERNATIONAL_PREFIX, "+");
  const phone = parsePhoneNumberFromString(western, defaultCountry);

  return phone?.isValid() ? phone.number : null;
};

/** Formats an E.164 number for display; returns the input if it can't parse. */
export const formatPhone = (
  e164: string,
  style: "international" | "national" = "international"
) => {
  const phone = parsePhoneNumberFromString(
    e164.startsWith("+") ? e164 : `+${e164}`
  );

  if (!phone) {
    return e164;
  }

  return style === "national"
    ? phone.formatNational()
    : phone.formatInternational();
};
