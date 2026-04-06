import { TIMEZONE, TIMEZONE_NAME } from "@/i18n/locale";
import { TZDate } from "@date-fns/tz";
import { formatDate, isExists, startOfDay } from "date-fns";
import { createParser } from "nuqs";
import { z } from "zod";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_ONLY_FORMAT = "yyyy-MM-dd";

/**
 * Parses "yyyy-MM-dd" strings into TZDate objects.
 */
const parseDateOnly = (value: string): TZDate | null => {
	const match = DATE_ONLY_PATTERN.exec(value);

	if (!match) {
		return null;
	}

	const [, year, month, day] = match;
	const parsedYear = Number(year);
	const parsedMonth = Number(month) - 1;
	const parsedDay = Number(day);

	if (!isExists(parsedYear, parsedMonth, parsedDay)) {
		return null;
	}

	return new TZDate(parsedYear, parsedMonth, parsedDay, TIMEZONE_NAME);
};

export const toTZDate = (value: Date | number | string): TZDate => {
	if (value instanceof Date) {
		return TZDate.tz(TIMEZONE_NAME, value);
	}

	if (typeof value === "number") {
		return TZDate.tz(TIMEZONE_NAME, value);
	}

	return TZDate.tz(TIMEZONE_NAME, value);
};

export const now = (): TZDate => TZDate.tz(TIMEZONE_NAME);

export const today = (): TZDate => startOfDay(now());

export const parseAsTZDate = createParser<TZDate>({
	parse: parseDateOnly,
	serialize: (date) => formatDate(date, DATE_ONLY_FORMAT, { in: TIMEZONE }),
	eq: (a, b) => a.getTime() === b.getTime(),
});

export const tzDateSchema = z.coerce.date().transform((value) => toTZDate(value));
