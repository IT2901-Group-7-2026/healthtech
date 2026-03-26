import { type Sensor } from "@/features/sensor-picker/sensors.ts";
import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { minutesToMilliseconds } from "date-fns";
import { fetchWithUserId } from "./api-client.ts";
import {
	type Note,
	type NoteDataRequest,
	NoteSchema,
	type OverviewBucketDto,
	OverviewBucketDtoSchema,
	type SensorDataRequestDto,
	type SensorDataResponseDto,
	SensorDataResponseDtoSchema,
	type SensorOverviewDataRequestDto,
	ThresholdSummarySchema,
	UserSchema,
	UserWithStatusSchema,
} from "./dto.ts";
import { getStartEnd } from "./sensor-query-utils.ts";
import { type View } from "./views.ts";

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
	});
}

const fetchSensorData = async (
	sensor: Sensor,
	sensorDataRequest: SensorDataRequestDto,
	userId?: string,
): Promise<Array<SensorDataResponseDto>> => {
	const response = await fetchWithUserId(`sensor/${sensor}/${userId}`, {
		method: "POST",
		body: JSON.stringify(sensorDataRequest),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch sensor data");
	}

	const json = await response.json();
	return SensorDataResponseDtoSchema.array().parseAsync(json);
};

const fetchSensorOverviewData = async (
	requests: SensorOverviewDataRequestDto,
	userId?: string,
): Promise<Array<OverviewBucketDto>> => {
	const response = await fetchWithUserId(`sensor/overview/${userId}`, {
		method: "POST",
		body: JSON.stringify(requests),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch sensor overview data");
	}

	const json = await response.json();
	return OverviewBucketDtoSchema.array().parseAsync(json);
};

export function sensorOverviewQueryOptions({
	query,
	userId,
}: {
	query: SensorOverviewDataRequestDto;
	userId?: string;
}) {
	return queryOptions({
		queryKey: [query, userId],
		queryFn: () => fetchSensorOverviewData(query, userId),
		staleTime: minutesToMilliseconds(10),
	});
}

export function sensorQueryOptions({
	sensor,
	query,
	userId,
	enabled,
}: {
	sensor: Sensor;
	query: SensorDataRequestDto;
	userId?: string;
	enabled?: boolean;
}) {
	return queryOptions({
		queryKey: [sensor, query, userId],
		queryFn: () => fetchSensorData(sensor, query, userId),
		staleTime: minutesToMilliseconds(10),
		enabled,
	});
}

export const fetchNoteData = async (
	noteDataRequest: NoteDataRequest,
	userId: string,
): Promise<Array<Note>> => {
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

export function notesQueryOptions({
	view,
	selectedDay,
	userId,
}: {
	view: View;
	selectedDay: Date;
	userId: string;
}) {
	const query = getStartEnd(view, selectedDay);

	return queryOptions({
		queryKey: ["notes", query, userId],
		queryFn: () => fetchNoteData(query, userId),
		staleTime: minutesToMilliseconds(10),
	});
}

export const updateNote = async ({
	note,
	userId,
}: {
	note: Note;
	userId: string;
}) => {
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

export const createNote = async ({
	note,
	userId,
}: {
	note: Note;
	userId: string;
}) => {
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

export const fetchSubordinatesQueryOptions = (
	userId: string,
	startTime?: Date,
	endTime?: Date,
) => {
	const params = new URLSearchParams();
	if (startTime) {
		params.append("startTime", startTime.toISOString());
	}
	if (endTime) {
		params.append("endTime", endTime.toISOString());
	}

	return queryOptions({
		queryKey: ["user.subordinates", userId, startTime, endTime],
		queryFn: async () => {
			const response = await fetchWithUserId(
				`users/${userId}/subordinates?${params.toString()}`,
			);

			if (!response.ok) {
				throw new Error("Failed to fetch subordinates");
			}

			const json = await response.json();
			return UserWithStatusSchema.array().parseAsync(json);
		},
		staleTime: minutesToMilliseconds(10),
	});
};

export const removeSubordinates = async (
	managerId: string,
	subordinateIds: Array<string>,
) => {
	const response = await fetchWithUserId(
		`users/${managerId}/subordinates/delete`,
		{
			method: "PUT",
			body: JSON.stringify(subordinateIds),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to remove subordinates: ${errorText}`);
	}
};

export const useRemoveSubordinatesMutation = (parentUserId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user.subordinates.remove", parentUserId],
		mutationFn: (subordinateIds: Array<string>) =>
			removeSubordinates(parentUserId, subordinateIds),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: fetchSubordinatesQueryOptions(parentUserId).queryKey,
			});
		},
	});
};

export const addSubordinates = async (
	managerId: string,
	subordinateIds: Array<string>,
) => {
	const response = await fetchWithUserId(
		`users/${managerId}/subordinates/create`,
		{
			method: "PUT",
			body: JSON.stringify(subordinateIds),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to add subordinates: ${errorText}`);
	}
};

export const useAddSubordinatesMutation = (parentUserId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["user.subordinates.add", parentUserId],
		mutationFn: (subordinateIds: Array<string>) =>
			addSubordinates(parentUserId, subordinateIds),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: fetchSubordinatesQueryOptions(parentUserId).queryKey,
			});
		},
	});
};

export const fetchThresholdSummaryQueryOptions = (
	managerUserId: string,
	startTime?: Date,
	endTime?: Date,
) =>
	queryOptions({
		queryKey: [
			"user.subordinates.threshold-summary",
			managerUserId,
			startTime,
			endTime,
		],
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
	});
