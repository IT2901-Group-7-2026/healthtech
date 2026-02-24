import { DANGER_LEVEL_SEVERITY } from "@/lib/danger-levels";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import { addHours } from "date-fns";
import type { WeekEvent } from "./types";

export const mapWeekDataToEvents = (
	data: Array<SensorDataResponseDto>,
	usePeakData?: boolean,
): Array<WeekEvent> =>
	data.map((item) => {
		const startDate = new Date(item.time);
		const endDate = addHours(new Date(item.time), 1);

		return {
			startDate: startDate,
			endDate: endDate,
			// biome-ignore lint/style/noNonNullAssertion: If usePeakData is true and peakDangerLevel is null, there is a bug somewhere else
			dangerLevel: usePeakData ? item.peakDangerLevel! : item.dangerLevel,
		};
	});

export const mapAllWeekDataToEvents = (
	everySensorData: AllSensors,
): Array<WeekEvent> => {
	const dustEvents = mapWeekDataToEvents(everySensorData.dust.data ?? []);
	const noiseEvents = mapWeekDataToEvents(
		everySensorData.noise.data ?? [],
		true,
	);
	const vibrationEvents = mapWeekDataToEvents(
		everySensorData.vibration.data ?? [],
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
		if (
			DANGER_LEVEL_SEVERITY[ev.dangerLevel] >
			DANGER_LEVEL_SEVERITY[existing.dangerLevel]
		) {
			existing.dangerLevel = ev.dangerLevel;
		}
	}

	const mergedEvents = Array.from(bySlot.values()).sort(
		(a, b) => a.startDate.getTime() - b.startDate.getTime(),
	);
	return mergedEvents;
};
