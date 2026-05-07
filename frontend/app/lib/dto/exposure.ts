import { type Exposure, ExposureSchema } from "@/features/exposure-picker/exposures";
import { tzDateSchema } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import { z } from "zod";
import { DangerLevelSchema } from "../danger-levels";
import { HourDomainDtoSchema } from "./hour-domain";

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

export type Aggregation = "average" | "peak";
export const Aggregations: Array<Aggregation> = ["average", "peak"];
