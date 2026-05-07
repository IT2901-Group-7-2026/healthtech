import { tzDateSchema } from "@/lib/date";
import { z } from "zod";
import { DangerLevelSchema } from "../danger-levels";

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
