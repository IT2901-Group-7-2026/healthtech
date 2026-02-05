import type { Sensor } from "@/features/sensor-picker/sensors";
import { z } from "zod";
import { DangerLevelSchema } from "./danger-levels";

export const granularityEnum = {
	minute: 0,
	hour: 1,
	day: 2,
} as const;
export type GranularityKey = keyof typeof granularityEnum;
export type GranularityValue = (typeof granularityEnum)[GranularityKey];

export const aggregateFnEnum = {
	avg: 0,
	sum: 1,
	min: 2,
	max: 3,
	count: 4,
} as const;
export type AggregateFnKey = keyof typeof aggregateFnEnum;
export type AggregateFnValue = keyof (typeof aggregateFnEnum)[AggregateFnKey];

export type SensorDataRequestDto = {
	startTime: Date;
	endTime: Date;
	granularity: GranularityKey;
	function: AggregateFnKey;
	field?: string;
};

export const SensorDataResponseDtoSchema = z.object({
	time: z.coerce.date(),
	value: z.number(),
	dangerLevel: DangerLevelSchema,
})

export type SensorDataResponseDto = z.infer<typeof SensorDataResponseDtoSchema>;

export type SensorDataResult = {
	data: Array<SensorDataResponseDto> | undefined;
	isLoading: boolean;
	isError: boolean;
};

export type AllSensors = Record<Sensor, SensorDataResult>;

export type AllSensorData = {
	everySensorData: AllSensors;
	isLoadingAny: boolean;
	isErrorAny: boolean;
};

export const NoteSchema = z.object({
	note: z.string(),
	time: z.coerce.date(),
});

export type Note = z.infer<typeof NoteSchema>;

export type NoteDataRequest = {
	startTime: Date;
	endTime: Date;
};

export const UserSchema = z.object({
	id: z.guid(),
	username: z.string(),
	email: z.email(),
	jobDescription: z.string().nullable(),
	createdAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>;