import type { TZDate } from "@date-fns/tz";
import { startOfDay } from "date-fns";
import type { ExposureDataRequestDto, ExposureOverviewRequestDto } from "./dto";
import { type Exposure, exposures } from "./exposures";

/**
 * For queries that fetches data for exact time-ranges and not just whole days, `windowed` should be used.
 * If not, startTime and endTime will be normalized to the start of their respective days to ensure cache key consistency.
 */
export type ExposureQueryKind = "default" | "windowed";

function buildExposureQueryCachePart({
	query,
	queryKind,
	windowMinutes,
}: {
	query?: ExposureDataRequestDto;
	queryKind?: ExposureQueryKind;
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

export function buildExposureQueryKey({
	exposure,
	userId,
	query,
	queryKind,
	windowMinutes,
}: {
	exposure: Exposure;
	userId?: string;
	query?: ExposureDataRequestDto;
	queryKind?: ExposureQueryKind;
	windowMinutes?: number;
}) {
	return ["exposure", userId ?? null, exposure, ...buildExposureQueryCachePart({ query, queryKind, windowMinutes })];
}

export function buildExposureOverviewQueryKey({
	query,
	userId,
	queryKind,
	windowMinutes,
}: {
	query: ExposureOverviewRequestDto;
	userId?: string;
	queryKind?: ExposureQueryKind;
	windowMinutes?: number;
}) {
	const exposureKeys = exposures.map((exposure) => [
		exposure,
		...buildExposureQueryCachePart({
			query: query[exposure],
			queryKind,
			windowMinutes,
		}),
	]);

	return ["exposure-overview", userId ?? null, ...exposureKeys.flat()];
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
