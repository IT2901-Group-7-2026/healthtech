import { type Exposure, ExposureSchema } from "@/features/exposure-picker/exposures";
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

export type ExposureDataRequestDto = {
	startTime: TZDate;
	endTime: TZDate;
	granularity: GranularityKey;
	function: AggregateFnKey;
	field?: ExposureTypeField;
};

export type ExposureOverviewRequestDto = Partial<Record<Exposure, ExposureDataRequestDto>>;

export const ExposureDtoSchema = z.object({
	time: tzDateSchema,
	value: z.number(),
	peakValue: z.number().nullable(),
	dangerLevel: DangerLevelSchema,
	peakDangerLevel: DangerLevelSchema.nullable(),
});

export type ExposureDto = z.infer<typeof ExposureDtoSchema>;

export const ExposureResponseDtoSchema = z.object({
	data: ExposureDtoSchema.array(),
	hourDomain: HourDomainDtoSchema,
});

export type ExposureResponseDto = z.infer<typeof ExposureResponseDtoSchema>;

// TODO: This should (maybe) include peakDangerLevel
export const ExposureOverviewBucketDtoSchema = z.object({
	time: tzDateSchema,
	dangerLevel: DangerLevelSchema,
	exposureDangerLevels: z.partialRecord(ExposureSchema, DangerLevelSchema),
});

export type ExposureOverviewBucketDto = z.infer<typeof ExposureOverviewBucketDtoSchema>;

export const ExposureOverviewResponseDtoSchema = z.object({
	data: ExposureOverviewBucketDtoSchema.array(),
	hourDomain: HourDomainDtoSchema,
});

export type ExposureOverviewResponseDto = z.infer<typeof ExposureOverviewResponseDtoSchema>;

export type ExposureDataResult = {
	data: Array<ExposureDto> | undefined;
	isLoading: boolean;
	isError: boolean;
};

export type AllExposures = Record<Exposure, ExposureDataResult>;

export type AllExposureData = {
	everyExposureData: AllExposures;
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
	name: z.string(),
	email: z.email(),
	jobDescription: z.string().nullable(),
	createdAt: tzDateSchema,
	role: UserRoleSchema,
	location: LocationSchema,
});

export type User = z.infer<typeof UserSchema>;

export const UserExposureStatusSchema = z.object({
	dangerLevel: DangerLevelSchema,
	peakDangerLevel: DangerLevelSchema.nullable(),
	value: z.number(),
	peakValue: z.number().nullable(),
});

export type UserExposureStatusDto = z.infer<typeof UserExposureStatusSchema>;

export const UserStatusSchema = z.object({
	userId: z.string(),
	status: DangerLevelSchema,
	noise: UserExposureStatusSchema.nullable(),
	dust: UserExposureStatusSchema.nullable(),
	vibration: UserExposureStatusSchema.nullable(),
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

export const ExposureThresholdSummarySchema = z.object({
	safe: z.int().nonnegative(),
	warning: z.int().nonnegative(),
	danger: z.int().nonnegative(),
});

export const ThresholdSummarySchema = z.object({
	total: ExposureThresholdSummarySchema,
	dust: ExposureThresholdSummarySchema,
	vibration: ExposureThresholdSummarySchema,
	noise: ExposureThresholdSummarySchema,
} satisfies Record<Exposure | "total", unknown>);

export type ExposureThresholdSummary = z.infer<typeof ExposureThresholdSummarySchema>;
export type ThresholdSummary = z.infer<typeof ThresholdSummarySchema>;

export const ExposureTypeFieldSchema = z.enum([
	"pm1_stel",
	"pm25_stel",
	"pm4_stel",
	"pm10_stel",
	"pm1_twa",
	"pm25_twa",
	"pm4_twa",
	"pm10_twa",
]);

export type ExposureTypeField = z.infer<typeof ExposureTypeFieldSchema>;
