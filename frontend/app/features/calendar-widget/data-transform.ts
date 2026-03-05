import type { Sensor } from "@/features/sensor-picker/sensors";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import type { MonthData } from "./calendar-widget";

export const mapSensorDataToMonthLists = (
	data: Array<SensorDataResponseDto>,
	relevantSensor: Sensor,
	usePeakData?: boolean,
): MonthData => {
	const safeDates: Array<Date> = data
		.filter(
			(d) => (usePeakData ? d.peakDangerLevel : d.dangerLevel) === "safe",
		)
		.map((d) => new Date(d.time));
	const warningDates: Array<Date> = data
		.filter(
			(d) =>
				(usePeakData ? d.peakDangerLevel : d.dangerLevel) === "warning",
		)
		.map((d) => new Date(d.time));
	const dangerDates: Array<Date> = data
		.filter(
			(d) =>
				(usePeakData ? d.peakDangerLevel : d.dangerLevel) === "danger",
		)
		.map((d) => new Date(d.time));

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
		true,
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
