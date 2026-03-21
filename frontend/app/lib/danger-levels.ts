import type { Sensor } from "@/features/sensor-picker/sensors";
import { t } from "i18next";
import z from "zod";
import type { UserWithStatusDto } from "./dto";

export const DANGER_LEVEL_SEVERITY: Record<DangerLevel, number> = {
	danger: 2,
	warning: 1,
	safe: 0,
} as const;

export const DangerLevelSchema = z.enum(["safe", "warning", "danger"]);
export type DangerLevel = z.infer<typeof DangerLevelSchema>;

type DangerLevelInfo = {
	label: string;
	color: string;
};

export const DangerLevels: Record<DangerLevel, DangerLevelInfo> = {
	danger: {
		label: "Threshold exceeded!",
		color: "danger",
	},
	warning: {
		label: "Close to exposure limit",
		color: "warning",
	},
	safe: {
		label: "Safely within exposure limit",
		color: "safe",
	},
};

export const mapDangerLevelToLabel = (dangerLevel: DangerLevel): string =>
	t(($) => $[dangerLevel]);

export const mapDangerLevelToColor = (dangerLevel: DangerLevel): string =>
	DangerLevels[dangerLevel].color;

export const dangerlevelStyles = {
	danger: {
		bg: "bg-danger",
		text: "text-danger",
	},
	warning: {
		bg: "bg-warning",
		text: "text-warning",
	},
	safe: {
		bg: "bg-safe",
		text: "text-safe",
	},
} satisfies Record<DangerLevel, { bg: string; text: string }>;

export function getHighestDangerLevel(
	operators: Array<UserWithStatusDto>,
	sensor: Sensor | null,
): DangerLevel {
	let highestLevel: DangerLevel = "safe";

	operators.forEach((operator) => {
		const level = sensor
			? (operator.status[sensor]?.dangerLevel ?? "safe")
			: operator.status.status;

		if (
			DANGER_LEVEL_SEVERITY[level] > DANGER_LEVEL_SEVERITY[highestLevel]
		) {
			highestLevel = level;
		}
	});

	return highestLevel;
}
