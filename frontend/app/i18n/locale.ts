import type { Locale } from "date-fns";
import { enGB, nb } from "date-fns/locale";

export const languageToLocale: Record<string, Locale> = { no: nb, en: enGB };
