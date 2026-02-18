import { type FormatOptions, formatDate, type Locale } from "date-fns";
import { useTranslation } from "react-i18next";
import { getLocale, TIMEZONE } from "@/i18n/locale.js";

export const getFormatOptions = (
	i18nLanguage: string | Locale | null | undefined,
) => {
	let locale: FormatOptions["locale"];

	if (i18nLanguage) {
		if (typeof i18nLanguage === "string") {
			locale = getLocale(i18nLanguage);
		} else {
			locale = i18nLanguage;
		}
	}

	return { locale, in: TIMEZONE } as const satisfies FormatOptions;
};

/**
 * A wrapper that pre-applies locale and timezone.
 *
 * @see {getFormatOptions} for the options that are applied
 * @example
 * const format = useFormatDate();
 *
 * // Use exactly like date-fns' format/formatDate
 * const string = format(date, "yyyy-MM-dd");
 */
export const useFormatDate = () => {
	const { i18n } = useTranslation();

	return (...args: Parameters<typeof formatDate>) => {
		const [date, formatStr, options] = args;

		return formatDate(date, formatStr, {
			...getFormatOptions(i18n.language),
			...options,
		});
	};
};
