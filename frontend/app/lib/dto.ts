import { type Sensor, SensorSchema } from "@/features/sensor-picker/sensors";
import { tzDateSchema } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import { z } from "zod";
import { DangerLevelSchema } from "./danger-levels";

// TODO: Split this file into multiple files based on domain

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

export const DEFAULT_MIN_HOUR_DOMAIN = 0;
export const DEFAULT_MAX_HOUR_DOMAIN = 23;

export const HourDomainDtoSchema = z.object({
	minHourUtc: z.int().min(0),
	maxHourUtc: z.int().max(23),
});

export type HourDomainDto = z.infer<typeof HourDomainDtoSchema>;

export type SensorDataRequestDto = {
	startTime: TZDate;
	endTime: TZDate;
	granularity: GranularityKey;
	function: AggregateFnKey;
	field?: SensorTypeField;
	clampEndTimeToNow?: boolean;
};

export type SensorOverviewRequestDto = Partial<Record<Sensor, SensorDataRequestDto>>;

export const SensorDtoSchema = z.object({
	time: tzDateSchema,
	value: z.number(),
	peakValue: z.number().nullable(),
	dangerLevel: DangerLevelSchema,
	peakDangerLevel: DangerLevelSchema.nullable(),
});

export type SensorDto = z.infer<typeof SensorDtoSchema>;

export const SensorResponseDtoSchema = z.object({
	data: SensorDtoSchema.array(),
	hourDomain: HourDomainDtoSchema,
});

export type SensorResponseDto = z.infer<typeof SensorResponseDtoSchema>;

// TODO: This should (maybe) include peakDangerLevel
export const SensorOverviewBucketDtoSchema = z.object({
	time: tzDateSchema,
	dangerLevel: DangerLevelSchema,
	sensorDangerLevels: z.partialRecord(SensorSchema, DangerLevelSchema),
});

export type SensorOverviewBucketDto = z.infer<typeof SensorOverviewBucketDtoSchema>;

export const SensorOverviewResponseDtoSchema = z.object({
	data: SensorOverviewBucketDtoSchema.array(),
	hourDomain: HourDomainDtoSchema,
});

export type SensorOverviewResponseDto = z.infer<typeof SensorOverviewResponseDtoSchema>;

export type SensorDataResult = {
	data: Array<SensorDto> | undefined;
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
	time: tzDateSchema,
});

export type Note = z.infer<typeof NoteSchema>;

export type NoteDataRequest = {
	startTime: TZDate;
	endTime: TZDate;
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
	building: z.string().nullable(), //TODO: Make non-nullable in backend, and make sure all operators in demo team is in same location
});

export type Location = z.infer<typeof LocationSchema>;

export const UserSchema = z.object({
	id: z.guid(),
	username: z.string(),
	email: z.email(),
	jobDescription: z.string().nullable(),
	createdAt: tzDateSchema,
	role: UserRoleSchema,
	location: LocationSchema,
});

export type User = z.infer<typeof UserSchema>;

export const UserSensorStatusSchema = z.object({
	dangerLevel: DangerLevelSchema,
	peakDangerLevel: DangerLevelSchema.nullable(),
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
	location.building ? `${location.building}, ${location.site}` : location.site;

export type Aggregation = "average" | "peak";
export const Aggregations: Array<Aggregation> = ["average", "peak"];

export const SensorThresholdSummarySchema = z.object({
	safe: z.int().nonnegative(),
	warning: z.int().nonnegative(),
	danger: z.int().nonnegative(),
});

export const ThresholdSummarySchema = z.object({
	total: SensorThresholdSummarySchema,
	dust: SensorThresholdSummarySchema,
	vibration: SensorThresholdSummarySchema,
	noise: SensorThresholdSummarySchema,
} satisfies Record<Sensor | "total", unknown>);

export type SensorThresholdSummary = z.infer<typeof SensorThresholdSummarySchema>;
export type ThresholdSummary = z.infer<typeof ThresholdSummarySchema>;

export const SensorTypeFieldSchema = z.enum([
	"pm1_stel",
	"pm25_stel",
	"pm4_stel",
	"pm10_stel",
	"pm1_twa",
	"pm25_twa",
	"pm4_twa",
	"pm10_twa",
]);

export type SensorTypeField = z.infer<typeof SensorTypeFieldSchema>;
