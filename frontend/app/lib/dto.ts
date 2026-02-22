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
});

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
export const UserRoleSchema = z.enum(["operator", "foreman"]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserRole = {
	Operator: "operator",
	Foreman: "foreman",
} as const satisfies Record<string, UserRole>;

export const LocationSchema = z.object({
	id: z.guid(),
	latitude: z.number(),
	longitude: z.number(),
	country: z.string(),
	region: z.string(),
	city: z.string(),
	site: z.string(),
	building: z.string().nullable(),
});

export type Location = z.infer<typeof LocationSchema>;

export const UserSchema = z.object({
	id: z.guid(),
	username: z.string(),
	email: z.email(),
	jobDescription: z.string().nullable(),
	createdAt: z.coerce.date(),
	role: UserRoleSchema,
	location: LocationSchema,
});

export type User = z.infer<typeof UserSchema>;

export const UserSensorStatusSchema = z.object({
	level: DangerLevelSchema,
	value: z.number(),
	peakValue: z.number().nullable(),
});

export type UserSensorStatusDto = z.infer<typeof UserSensorStatusSchema>;

export const UserStatusSchema = z.object({
	userId: z.string(),
	status: DangerLevelSchema,
	noise: UserSensorStatusSchema.nullable(),
	dust: UserSensorStatusSchema.nullable(),
	vibration: UserSensorStatusSchema.nullable(),
});

export type UserStatusDto = z.infer<typeof UserStatusSchema>;

export const UserWithStatusSchema = UserSchema.extend({
	status: UserStatusSchema,
});

export type UserWithStatusDto = z.infer<typeof UserWithStatusSchema>;

export const createLocationName = (location: Location) =>
	location.building
		? `${location.building}, ${location.site}`
		: location.site;
