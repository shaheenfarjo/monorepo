/**
 * Regional presets for `bun run init`. Each one fills `region` in
 * packages/config/project.json and turns the example prices (local seed,
 * marketing pricing page) into the local currency. Week starts and currency
 * decimals follow CLDR, the data Intl uses.
 */
export interface RegionPreset {
  country: string;
  currency: string;
  id: string;
  name: string;
  /** Payment provider to start with (see packages/payments). */
  payments: "stripe" | "wayl";
  phoneExample: string;
  /** Example prices in minor units: starter monthly, pro monthly, pro yearly. */
  prices: readonly [number, number, number];
  timeZone: string;
  /** Top-level domain for the default website URL. */
  tld: string;
  weekStartsOn: number;
}

export const regionPresets: readonly RegionPreset[] = [
  {
    country: "IQ",
    currency: "IQD",
    id: "IQ",
    name: "Iraq",
    payments: "wayl",
    phoneExample: "0770 123 4567",
    // IQD has no minor unit: 25,000 IQD.
    prices: [25_000, 75_000, 750_000],
    timeZone: "Asia/Baghdad",
    tld: "iq",
    weekStartsOn: 6,
  },
  {
    country: "SA",
    currency: "SAR",
    id: "SA",
    name: "Saudi Arabia",
    payments: "stripe",
    phoneExample: "050 123 4567",
    // Halalas: 49 SAR.
    prices: [4900, 14_900, 149_000],
    timeZone: "Asia/Riyadh",
    tld: "sa",
    weekStartsOn: 0,
  },
  {
    country: "AE",
    currency: "AED",
    id: "AE",
    name: "United Arab Emirates",
    payments: "stripe",
    phoneExample: "050 123 4567",
    prices: [4900, 14_900, 149_000],
    timeZone: "Asia/Dubai",
    tld: "ae",
    weekStartsOn: 1,
  },
  {
    country: "EG",
    currency: "EGP",
    id: "EG",
    name: "Egypt",
    payments: "stripe",
    phoneExample: "0100 123 4567",
    prices: [29_900, 99_900, 999_000],
    timeZone: "Africa/Cairo",
    tld: "eg",
    weekStartsOn: 6,
  },
  {
    country: "JO",
    currency: "JOD",
    id: "JO",
    name: "Jordan",
    payments: "stripe",
    phoneExample: "079 123 4567",
    // Fils (3 decimals): 9 JOD.
    prices: [9000, 29_000, 290_000],
    timeZone: "Asia/Amman",
    tld: "jo",
    weekStartsOn: 6,
  },
];

export const regionIds = regionPresets.map((preset) => preset.id);

export const getRegionPreset = (id: string) =>
  regionPresets.find((preset) => preset.id === id.toUpperCase());

/** The template's example prices (Iraq), as they appear in each file. */
const TEMPLATE = regionPresets[0] as RegionPreset;

/**
 * Exact text replaced in each file. The template test checks every `from`
 * still exists, so editing those files can't silently break init.
 */
export const regionalReplacements = (preset: RegionPreset) => {
  const [starter, pro, proYearly] = preset.prices;
  const [templateStarter, templatePro, templateYearly] = TEMPLATE.prices;
  const seedRow = (amount: number) => `${amount}, '${preset.currency}'`;
  const literal = (amount: number) =>
    amount.toLocaleString("en").replaceAll(",", "_");

  return {
    "apps/web/app/[locale]/pricing/page.tsx": [
      ["prices in IQD per month", `prices in ${preset.currency} per month`],
      [`price: ${literal(templateStarter)} }`, `price: ${literal(starter)} }`],
      [`price: ${literal(templatePro)} }`, `price: ${literal(pro)} }`],
    ],
    "packages/database/supabase/seed.sql": [
      ["Prices are in IQD", `Prices are in ${preset.currency}`],
      [`${templateStarter}, 'IQD'`, seedRow(starter)],
      [`${templatePro}, 'IQD'`, seedRow(pro)],
      [`${templateYearly}, 'IQD'`, seedRow(proYearly)],
    ],
  } satisfies Record<string, [string, string][]>;
};
