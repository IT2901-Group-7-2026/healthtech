import { tz } from "@date-fns/tz";
import type { Locale } from "date-fns";
import { enGB, nb } from "date-fns/locale";

export const getLocale = (i18nLanguage: string): Locale => {
	switch (i18nLanguage) {
		case "no": {
			return nb;
		}

		case "en": {
			return enGB;
		}

		default: {
			throw new Error(`Unsupported language: ${i18nLanguage}`);
		}
	}
};

export const TIMEZONE = tz("Europe/Oslo");
