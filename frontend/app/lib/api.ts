import type { Sensor } from "@/features/sensor-picker/sensors";
import { queryOptions } from "@tanstack/react-query";
import type {
	Note,
	NoteDataRequest,
	SensorDataRequestDto,
	SensorDataResponseDto,
} from "./dto";
import { getStartEnd } from "./queries";
import type { View } from "./views";

const baseURL = import.meta.env.VITE_BASE_URL;

const uid = "8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f"; //temporary

// TODO: Parse response with zod - related to issue #HLTH-17
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

	return response.json();
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
		staleTime: 10 * 60 * 1000, // 10 min
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

	const data = await response.json();

	// parse time as Date object
	return data.map((note: Note) => ({
		...note,
		time: new Date(note.time),
	}));
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
		staleTime: 10 * 60 * 1000, // 10 min
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

	return res.json();
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

	return res.json();
};
