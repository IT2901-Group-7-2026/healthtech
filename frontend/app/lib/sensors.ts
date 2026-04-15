import type { SensorTypeField } from "@/lib/dto";
import { parseAsStringLiteral } from "nuqs";

export const sensors = ["dust", "noise", "vibration"] as const;
export type Sensor = (typeof sensors)[number];
export const parseAsSensor = parseAsStringLiteral(sensors);

export const sensorUnits = ["mg", "ug", "points", "db", "dbTwa"] as const;
export type SensorUnit = (typeof sensorUnits)[number];
export const parseAsSensorUnit = parseAsStringLiteral(sensorUnits);

export const dustFields = ["pm1_twa", "pm25_twa", "pm10_twa"] as const satisfies ReadonlyArray<SensorTypeField>;
export type DustField = (typeof dustFields)[number];
export const defaultDustField: DustField = "pm1_twa";
export const parseAsDustField = parseAsStringLiteral(dustFields);

export function isSensor(input: string): input is Sensor {
	// biome-ignore lint/suspicious/noExplicitAny: Array#includes requires argument to be a sensor, not a string
	return sensors.includes(input as any);
}

export function toSensor(input: string): Sensor | null {
	const string = input.toLowerCase().replaceAll(/[^a-z]/g, "");

	if (isSensor(string)) {
		return string;
	}

	return null;
}
