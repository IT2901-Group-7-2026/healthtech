import type { ExposureTypeField } from "@/lib/dto/exposure";
import { parseAsStringLiteral } from "nuqs";

export const exposures = ["dust", "noise", "vibration"] as const;
export type Exposure = (typeof exposures)[number];
export const parseAsExposure = parseAsStringLiteral(exposures);

export const exposureUnits = ["mg", "ug", "points", "db"] as const;
export type ExposureUnit = (typeof exposureUnits)[number];
export const parseAsExposureUnit = parseAsStringLiteral(exposureUnits);

export const dustFields = ["pm1_twa", "pm25_twa", "pm10_twa"] as const satisfies ReadonlyArray<ExposureTypeField>;
export type DustField = (typeof dustFields)[number];
export const defaultDustField: DustField = "pm1_twa";
export const parseAsDustField = parseAsStringLiteral(dustFields);

export function isExposure(input: string): input is Exposure {
	// biome-ignore lint/suspicious/noExplicitAny: Array#includes requires argument to be a exposure, not a string
	return exposures.includes(input as any);
}

export function toExposure(input: string): Exposure | null {
	const string = input.toLowerCase().replaceAll(/[^a-z]/g, "");

	if (isExposure(string)) {
		return string;
	}

	return null;
}
