import type { Exposure } from "@/features/exposure-picker/exposures.ts";
import type { TZDate } from "@date-fns/tz";
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { minutesToMilliseconds } from "date-fns";
import { fetchWithUserId } from "./api-client.ts";
import {
	type ExposureDataRequestDto,
	type ExposureOverviewRequestDto,
	type ExposureOverviewResponseDto,
	ExposureOverviewResponseDtoSchema,
	type ExposureResponseDto,
	ExposureResponseDtoSchema,
} from "./dto/exposure.ts";
import { type Note, type NoteDataRequest, NoteSchema } from "./dto/note.ts";
import { ThresholdSummarySchema } from "./dto/threshold.ts";
import { UserSchema, UserWithStatusSchema } from "./dto/user.ts";
import { getStartEnd } from "./exposure-query-utils.ts";
import {
	buildExposureOverviewQueryKey,
	buildExposureQueryKey,
	buildNotesQueryKey,
	buildSubordinatesQueryKey,
	buildSubordinatesQueryPrefix,
	buildThresholdSummaryQueryKey,
	type ExposureQueryKind,
} from "./query-key-builder.ts";
import type { View } from "./views.ts";

// We have at most 1 data point every minute so we don't need a shorter refetch interval than that
const DEFAULT_REFETCH_INTERVAL = minutesToMilliseconds(1);

const fetchAllUsers = async () => {
	const response = await fetchWithUserId("users");

	if (!response.ok) {
		throw new Error("Failed to fetch users");
	}

	const json = await response.json();
	return UserSchema.array().parseAsync(json);
};

export function usersQueryOptions() {
	return queryOptions({
		queryKey: ["users"],
		queryFn: () => fetchAllUsers(),
		staleTime: minutesToMilliseconds(10),
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
	});
}

const fetchExposureData = async (
	exposure: Exposure,
	exposureDataRequest: ExposureDataRequestDto,
	userId?: string,
): Promise<ExposureResponseDto> => {
	const response = await fetchWithUserId(`exposure/${exposure}/${userId}`, {
		method: "POST",
		body: JSON.stringify(exposureDataRequest),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch exposure data");
	}

	const json = await response.json();
	return ExposureResponseDtoSchema.parseAsync(json);
};

const fetchExposureOverviewData = async (
	requests: ExposureOverviewRequestDto,
	userId?: string,
): Promise<ExposureOverviewResponseDto> => {
	const response = await fetchWithUserId(`exposure/overview/${userId}`, {
		method: "POST",
		body: JSON.stringify(requests),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch exposure overview data");
	}

	const json = await response.json();
	return ExposureOverviewResponseDtoSchema.parseAsync(json);
};

export function exposureOverviewQueryOptions({
	query,
	userId,
	enabled,
	queryKind,
	windowMinutes,
}: {
	query: ExposureOverviewRequestDto;
	userId?: string;
	enabled?: boolean;
	queryKind?: ExposureQueryKind;
	windowMinutes?: number;
}) {
	return queryOptions({
		queryKey: buildExposureOverviewQueryKey({
			userId,
			query,
			queryKind,
			windowMinutes,
		}),
		queryFn: () => fetchExposureOverviewData(query, userId),
		staleTime: minutesToMilliseconds(10),
		enabled,
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
		refetchIntervalInBackground: true,
	});
}

export function exposureQueryOptions({
	exposure,
	query,
	userId,
	enabled,
	queryKind,
	windowMinutes,
}: {
	exposure: Exposure;
	query: ExposureDataRequestDto;
	userId?: string;
	enabled?: boolean;
	queryKind?: ExposureQueryKind;
	windowMinutes?: number;
}) {
	return queryOptions({
		queryKey: buildExposureQueryKey({
			exposure,
			userId,
			query,
			queryKind,
			windowMinutes,
		}),
		queryFn: () => fetchExposureData(exposure, query, userId),
		staleTime: minutesToMilliseconds(10),
		enabled,
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
		refetchIntervalInBackground: true,
	});
}

export const fetchNoteData = async (noteDataRequest: NoteDataRequest, userId: string): Promise<Array<Note>> => {
	const response = await fetchWithUserId(`notes/${userId}`, {
		method: "POST",
		body: JSON.stringify(noteDataRequest),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch daily notes");
	}

	const json = await response.json();
	return NoteSchema.array().parseAsync(json);
};

export function notesQueryOptions({ view, selectedDay, userId }: { view: View; selectedDay: TZDate; userId: string }) {
	const query = getStartEnd(view, selectedDay);

	return queryOptions({
		queryKey: buildNotesQueryKey(userId, query.startTime, query.endTime),
		queryFn: () => fetchNoteData(query, userId),
		staleTime: minutesToMilliseconds(10),
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
	});
}

export const updateNote = async ({ note, userId }: { note: Note; userId: string }) => {
	const res = await fetchWithUserId(`notes/${userId}`, {
		method: "PUT",
		body: JSON.stringify(note),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to update note: ${errorText}`);
	}

	const json = await res.json();
	return NoteSchema.parseAsync(json);
};

export const createNote = async ({ note, userId }: { note: Note; userId: string }) => {
	const res = await fetchWithUserId(`notes/${userId}/create`, {
		method: "POST",
		body: JSON.stringify(note),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to create note: ${errorText}`);
	}

	const json = await res.json();
	return NoteSchema.parseAsync(json);
};

export const deleteNote = async ({ time, userId }: { time: TZDate; userId: string }) => {
	const res = await fetchWithUserId(`notes/${userId}`, {
		method: "DELETE",
		body: JSON.stringify(time),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to delete note: ${errorText}`);
	}

	const json = await res.json();
	return NoteSchema.parseAsync(json);
};

export const fetchSubordinatesQueryOptions = (userId: string, startTime?: TZDate, endTime?: TZDate) => {
	const params = new URLSearchParams();
	if (startTime) {
		params.append("startTime", startTime.toISOString());
	}
	if (endTime) {
		params.append("endTime", endTime.toISOString());
	}

	return queryOptions({
		queryKey: buildSubordinatesQueryKey(userId, startTime, endTime),
		queryFn: async () => {
			const response = await fetchWithUserId(`users/${userId}/subordinates?${params.toString()}`);

			if (!response.ok) {
				throw new Error("Failed to fetch subordinates");
			}

			const json = await response.json();
			return UserWithStatusSchema.array().parseAsync(json);
		},
		staleTime: minutesToMilliseconds(10),
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
		refetchIntervalInBackground: true,
	});
};

export const removeSubordinates = async (managerId: string, subordinateIds: Array<string>) => {
	const response = await fetchWithUserId(`users/${managerId}/subordinates/delete`, {
		method: "PUT",
		body: JSON.stringify(subordinateIds),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to remove subordinates: ${errorText}`);
	}
};

export const useRemoveSubordinatesMutation = (parentUserId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user.subordinates.remove", parentUserId],
		mutationFn: (subordinateIds: Array<string>) => removeSubordinates(parentUserId, subordinateIds),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: buildSubordinatesQueryPrefix(parentUserId),
			});
		},
	});
};

export const addSubordinates = async (managerId: string, subordinateIds: Array<string>) => {
	const response = await fetchWithUserId(`users/${managerId}/subordinates/create`, {
		method: "PUT",
		body: JSON.stringify(subordinateIds),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to add subordinates: ${errorText}`);
	}
};

export const useAddSubordinatesMutation = (parentUserId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user.subordinates.add", parentUserId],
		mutationFn: (subordinateIds: Array<string>) => addSubordinates(parentUserId, subordinateIds),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: buildSubordinatesQueryPrefix(parentUserId),
			});
		},
	});
};

export const fetchThresholdSummaryQueryOptions = (managerUserId: string, startTime?: TZDate, endTime?: TZDate) =>
	queryOptions({
		queryKey: buildThresholdSummaryQueryKey(managerUserId, startTime, endTime),
		queryFn: async () => {
			const params = new URLSearchParams();
			if (startTime) {
				params.append("startTime", startTime.toISOString());
			}
			if (endTime) {
				params.append("endTime", endTime.toISOString());
			}

			const response = await fetchWithUserId(
				`users/${managerUserId}/subordinates/threshold-summary?${params.toString()}`,
				{
					method: "GET",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch threshold summary");
			}

			const json = await response.json();
			return ThresholdSummarySchema.parseAsync(json);
		},
		staleTime: minutesToMilliseconds(10),
		refetchInterval: DEFAULT_REFETCH_INTERVAL,
		placeholderData: keepPreviousData,
		refetchIntervalInBackground: true,
	});
