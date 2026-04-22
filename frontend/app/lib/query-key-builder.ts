import type { TZDate } from "@date-fns/tz";
import { startOfDay } from "date-fns";
import type { SensorDataRequestDto, SensorOverviewRequestDto } from "./dto";
import { type Sensor, sensors } from "./sensors";

/**
 * For queries that fetches data for exact time-ranges and not just whole days, `windowed` should be used.
 * If not, startTime and endTime will be normalized to the start of their respective days to ensure cache key consistency.
 */
export type SensorQueryKind = "default" | "windowed";

function buildSensorQueryCachePart({
	query,
	queryKind,
	windowMinutes,
}: {
	query?: SensorDataRequestDto;
	queryKind?: SensorQueryKind;
	windowMinutes?: number;
}) {
	if (!query) {
		return ["disabled"];
	}

	const base = [query.field ?? null, query.granularity, query.function];

	if (queryKind === "windowed") {
		return [...base, "windowed", windowMinutes ?? null];
	}

	return [...base, startOfDay(query.startTime).getTime(), startOfDay(query.endTime).getTime()];
}

export function buildSensorQueryKey({
	sensor,
	userId,
	query,
	queryKind,
	windowMinutes,
}: {
	sensor: Sensor;
	userId?: string;
	query?: SensorDataRequestDto;
	queryKind?: SensorQueryKind;
	windowMinutes?: number;
}) {
	return ["sensor", userId ?? null, sensor, ...buildSensorQueryCachePart({ query, queryKind, windowMinutes })];
}

export function buildSensorOverviewQueryKey({
	query,
	userId,
	queryKind,
	windowMinutes,
}: {
	query: SensorOverviewRequestDto;
	userId?: string;
	queryKind?: SensorQueryKind;
	windowMinutes?: number;
}) {
	const sensorKeys = sensors.map((sensor) => [
		sensor,
		...buildSensorQueryCachePart({
			query: query[sensor],
			queryKind,
			windowMinutes,
		}),
	]);

	return ["sensor-overview", userId ?? null, ...sensorKeys.flat()];
}

export function buildSubordinatesQueryKey(userId: string, startTime?: TZDate, endTime?: TZDate) {
	const start = startTime ? startOfDay(startTime).getTime() : null;
	const end = endTime ? startOfDay(endTime).getTime() : null;

	return ["user.subordinates", userId, start, end];
}

export function buildNotesQueryKey(userId: string, startTime: TZDate, endTime: TZDate) {
	const start = startOfDay(startTime).getTime();
	const end = startOfDay(endTime).getTime();

	return ["notes", userId, start, end];
}

export function buildThresholdSummaryQueryKey(userId: string, startTime?: TZDate, endTime?: TZDate) {
	const start = startTime ? startOfDay(startTime).getTime() : null;
	const end = endTime ? startOfDay(endTime).getTime() : null;

	return ["user.subordinates.threshold-summary", userId, start, end];
}

export function buildNotesQueryKeyPrefix(userId: string) {
	return ["notes", userId];
}

export function buildSubordinatesQueryPrefix(userId: string) {
	return ["user.subordinates", userId];
}
