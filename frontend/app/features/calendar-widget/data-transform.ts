import type { Sensor } from "@/features/sensor-picker/sensors";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import type { MonthData } from "./calendar-widget";

const _mapMonthDataToDangerLists = (
	data: Array<SensorDataResponseDto>,
	sensor: Sensor,
) => {
	const safe: Array<Date> = [];
	const warning: Array<Date> = [];
	const danger: Array<Date> = [];
	const _thresholds = thresholds[sensor];

	Object.values(data).forEach((item) => {
		if (item.value < _thresholds.warning) {
			safe.push(new Date(item.time));
		} else if (item.value < _thresholds.danger) {
			warning.push(new Date(item.time));
		} else {
			danger.push(new Date(item.time));
		}
	});

	return { safe, warning, danger };
};

export const mapSensorDataToMonthLists = (
	data: Array<SensorDataResponseDto>,
	relevantSensor: Sensor,
): MonthData => {
	const safeDates: Array<Date> = [];
	const warningDates: Array<Date> = [];
	const dangerDates: Array<Date> = [];

	Object.values(data).forEach((item) => {
		if (item.value < thresholds[relevantSensor].warning) {
			safeDates.push(new Date(item.time));
		} else if (item.value < thresholds[relevantSensor].danger) {
			warningDates.push(new Date(item.time));
		} else {
			dangerDates.push(new Date(item.time));
		}
	});
	return {
		safe: { [relevantSensor]: safeDates },
		warning: { [relevantSensor]: warningDates },
		danger: { [relevantSensor]: dangerDates },
	};
};

export const mapAllSensorDataToMonthLists = (
	everySensorData: AllSensors,
): MonthData => {
	const dustData = mapSensorDataToMonthLists(
		everySensorData.dust.data ?? [],
		"dust",
	);
	const noiseData = mapSensorDataToMonthLists(
		everySensorData.noise.data ?? [],
		"noise",
	);
	const vibrationData = mapSensorDataToMonthLists(
		everySensorData.vibration.data ?? [],
		"vibration",
	);
	const mergedData: MonthData = {
		safe: {
			dust: dustData.safe?.dust ?? [],
			noise: noiseData.safe?.noise ?? [],
			vibration: vibrationData.safe?.vibration ?? [],
		},
		warning: {
			dust: dustData.warning?.dust ?? [],
			noise: noiseData.warning?.noise ?? [],
			vibration: vibrationData.warning?.vibration ?? [],
		},
		danger: {
			dust: dustData.danger?.dust ?? [],
			noise: noiseData.danger?.noise ?? [],
			vibration: vibrationData.danger?.vibration ?? [],
		},
	};
	return mergedData;
};
