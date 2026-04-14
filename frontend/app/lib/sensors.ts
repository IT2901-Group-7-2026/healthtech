import { parseAsStringLiteral } from "nuqs";

export const sensors = ["dust", "noise", "vibration"] as const;
export type Sensor = (typeof sensors)[number];
export const parseAsSensor = parseAsStringLiteral(sensors);

export const sensorUnits = ["μg/m³", "mg/m³", "points", "db", "db (TWA)"] as const;
export type SensorUnit = (typeof sensorUnits)[number];
export const parseAsSensorUnit = parseAsStringLiteral(sensorUnits);

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
