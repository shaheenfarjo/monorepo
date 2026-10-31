/**
 * Amounts are integers in the currency's minor unit, with the number of
 * decimals from CLDR (the data Intl uses): IQD 0, SAR/AED/EGP 2, JOD/KWD 3.
 * So 25,000 IQD is 25000, 49 SAR is 4900 and 9 JOD is 9000.
 */
export const currencyDigits = (currency: string) =>
  new Intl.NumberFormat("en", { currency, style: "currency" }).resolvedOptions()
    .maximumFractionDigits ?? 2;

/** 4900 (SAR) → 49, for APIs that take whole units (GA4, Meta, TikTok). */
export const toMajorUnits = (amount: number, currency: string) =>
  amount / 10 ** currencyDigits(currency);

/** 49 (SAR) → 4900. */
export const toMinorUnits = (amount: number, currency: string) =>
  Math.round(amount * 10 ** currencyDigits(currency));
