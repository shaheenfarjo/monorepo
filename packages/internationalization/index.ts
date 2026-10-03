import type {} from "./augment";
import { defaultLocale, isLocale } from "./config";
import type en from "./messages/en.json";

export {
  type Direction,
  defaultLocale,
  getDirection,
  getLocaleLabel,
  isLocale,
  type Locale,
  localeDefinitions,
  locales,
} from "./config";

export type Messages = typeof en;
/** @deprecated Use `Messages`. Kept for existing marketing-site components. */
export type Dictionary = Messages;

/** Loads the messages for a locale, falling back to the default locale. */
export const getMessages = async (locale: string): Promise<Messages> =>
  (await import(`./messages/${isLocale(locale) ? locale : defaultLocale}.json`))
    .default;

/** @deprecated Use `getMessages`. */
export const getDictionary = getMessages;
