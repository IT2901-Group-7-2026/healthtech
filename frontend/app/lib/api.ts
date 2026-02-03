import type { Sensor } from "@/features/sensor-picker/sensors";
import { queryOptions } from "@tanstack/react-query";
import {
	NoteSchema,
	SensorDataResponseDtoSchema,
	type Note,
	type NoteDataRequest,
	type SensorDataRequestDto,
	type SensorDataResponseDto,
} from "./dto";
import { getStartEnd } from "./queries";
import type { View } from "./views";
import { minutesToMilliseconds } from "date-fns";

const baseURL = import.meta.env.VITE_BASE_URL;

const uid = "8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f"; //temporary

const fetchSensorData = async (
	sensor: Sensor,
	sensorDataRequest: SensorDataRequestDto,
): Promise<Array<SensorDataResponseDto>> => {
	const response = await fetch(`${baseURL}sensor/${sensor}/${uid}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(sensorDataRequest),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch sensor data");
	}

	const json = await response.json()
	return SensorDataResponseDtoSchema.array().parseAsync(json);
};

export function sensorQueryOptions({
	sensor,
	query,
}: {
	sensor: Sensor;
	query: SensorDataRequestDto;
}) {
	return queryOptions({
		queryKey: [sensor, query],
		queryFn: () => fetchSensorData(sensor, query),
		staleTime: minutesToMilliseconds(10)
	});
}

export const fetchNoteData = async (
	noteDataRequest: NoteDataRequest,
): Promise<Array<Note>> => {
	const response = await fetch(`${baseURL}notes/${uid}`, {
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
}: {
	view: View;
	selectedDay: Date;
}) {
	const query = getStartEnd(view, selectedDay);

	return queryOptions({
		queryKey: ["notes", query],
		queryFn: () => fetchNoteData(query),
		staleTime: minutesToMilliseconds(10),
	});
}

export const updateNote = async ({ note }: { note: Note }) => {
	const res = await fetch(`${baseURL}notes/${uid}`, {
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

export const createNote = async ({ note }: { note: Note }) => {
	const res = await fetch(`${baseURL}notes/${uid}/create`, {
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
