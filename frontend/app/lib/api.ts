import type { Sensor } from "@/features/sensor-picker/sensors";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { minutesToMilliseconds } from "date-fns";
import {
	type Note,
	type NoteDataRequest,
	NoteSchema,
	type SensorDataRequestDto,
	type SensorDataResponseDto,
	SensorDataResponseDtoSchema,
	UserSchema,
	UserWithStatusSchema,
} from "./dto";
import { getStartEnd } from "./queries";
import type { View } from "./views";

const baseURL = import.meta.env.VITE_BASE_URL;

const fetchAllUsers = async () => {
	const response = await fetch(`${baseURL}users`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

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
	userId: string,
	sensor: Sensor,
	sensorDataRequest: SensorDataRequestDto,
): Promise<Array<SensorDataResponseDto>> => {
	const response = await fetch(`${baseURL}sensor/${sensor}/${userId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(sensorDataRequest),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch sensor data");
	}

	const json = await response.json();
	return SensorDataResponseDtoSchema.array().parseAsync(json);
};

export function sensorQueryOptions({
	sensor,
	query,
	userId,
}: {
	sensor: Sensor;
	query: SensorDataRequestDto;
	userId: string;
}) {
	return queryOptions({
		queryKey: [sensor, query],
		queryFn: () => fetchSensorData(userId, sensor, query),
		staleTime: minutesToMilliseconds(10),
	});
}

export const fetchNoteData = async (
	noteDataRequest: NoteDataRequest,
	userId: string,
): Promise<Array<Note>> => {
	const response = await fetch(`${baseURL}notes/${userId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
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
		queryKey: ["notes", query],
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
	const res = await fetch(`${baseURL}notes/${userId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
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
	const res = await fetch(`${baseURL}notes/${userId}/create`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(note),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to create note: ${errorText}`);
	}

	const json = await res.json();
	return NoteSchema.parseAsync(json);
};

export const useSubordinatesQuery = (userId: string) =>
	useQuery(
		queryOptions({
			queryKey: ["user.subordinates", userId],
			queryFn: async () => {
				const response = await fetch(
					`${baseURL}users/${userId}/subordinates`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch subordinates");
				}

				const json = await response.json();
				return UserWithStatusSchema.array().parseAsync(json);
			},
			staleTime: minutesToMilliseconds(10),
		}),
	);
