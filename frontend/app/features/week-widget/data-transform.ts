import type { Sensor } from "@/features/sensor-picker/sensors";
import { DANGER_LEVEL_SEVERITY } from "@/lib/danger-levels";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import { addHours } from "date-fns";
import type { WeekEvent } from "./types";

export const mapWeekDataToEvents = (
	data: Array<SensorDataResponseDto>,
	sensor: Sensor,
): Array<WeekEvent> => {
	return data.map((item) => {
		const startDate = new Date(item.time);
		const endDate = addHours(new Date(item.time), 1);
		
		return {
			startDate: startDate,
			endDate: endDate,
			dangerLevel: item.dangerLevel,
		};
	});
};

export const mapAllWeekDataToEvents = (
	everySensorData: AllSensors,
): Array<WeekEvent> => {
	const dustEvents = mapWeekDataToEvents(
		everySensorData.dust.data ?? [],
		"dust",
	);
	const noiseEvents = mapWeekDataToEvents(
		everySensorData.noise.data ?? [],
		"noise",
	);
	const vibrationEvents = mapWeekDataToEvents(
		everySensorData.vibration.data ?? [],
		"vibration",
	);
	const allEvents = [...dustEvents, ...noiseEvents, ...vibrationEvents];

	// Avoid duplicate events - map them by start time and choose one with highest danger
	const bySlot = new Map<number, WeekEvent>();

	for (const ev of allEvents) {
		const slotKey = ev.startDate.getTime();

		const existing = bySlot.get(slotKey);
		if (!existing) {
			bySlot.set(slotKey, { ...ev });
			continue;
		}

		// choose the event with highest danger level
		if (DANGER_LEVEL_SEVERITY[ev.dangerLevel] > DANGER_LEVEL_SEVERITY[existing.dangerLevel]) {
			existing.dangerLevel = ev.dangerLevel;
		}
	}

	const mergedEvents = Array.from(bySlot.values()).sort(
		(a, b) => a.startDate.getTime() - b.startDate.getTime(),
	);
	return mergedEvents;
};
