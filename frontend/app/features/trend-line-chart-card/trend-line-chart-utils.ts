import type { ExposureDto } from "@/lib/dto/exposure";
import { startOfWeek } from "date-fns";

/**
 * Returns one datapoint for each week, with the maximum value of that week
 */
export function toWeeklyMax(data: Array<ExposureDto>): Array<ExposureDto> {
	const maxByWeek = new Map<string, ExposureDto>();

	for (const item of data) {
		const weekStart = startOfWeek(item.time, { weekStartsOn: 1 });
		const key = weekStart.toISOString();

		const existing = maxByWeek.get(key);

		if (!existing || item.value > existing.value) {
			maxByWeek.set(key, {
				...item,
				time: weekStart,
			});
		}
	}

	return Array.from(maxByWeek.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
}
