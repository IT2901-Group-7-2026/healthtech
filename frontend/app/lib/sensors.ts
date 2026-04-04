import { parseAsStringLiteral } from "nuqs";

export type Sensor = (typeof sensors)[number];
export const sensors = ["dust", "noise", "vibration"] as const;
export const parseAsSensor = parseAsStringLiteral(sensors);

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
