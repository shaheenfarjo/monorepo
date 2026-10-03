import "server-only";
import type en from "./dictionaries/en.json";
import languine from "./languine.json" with { type: "json" };

export const locales = [
  languine.locale.source,
  ...languine.locale.targets,
] as const;

export type Dictionary = typeof en;

const loadEnglish = async () =>
  (await import("./dictionaries/en.json")).default as Dictionary;

const dictionaries: Record<string, () => Promise<Dictionary>> =
  Object.fromEntries(
    locales.map((locale) => [
      locale,
      async () => {
        try {
          return (await import(`./dictionaries/${locale}.json`))
            .default as Dictionary;
        } catch {
          return loadEnglish();
        }
      },
    ])
  );

export const getDictionary = (locale: string): Promise<Dictionary> => {
  const [language = "en"] = locale.split("-");
  const load = dictionaries[language];

  return load ? load() : loadEnglish();
};
