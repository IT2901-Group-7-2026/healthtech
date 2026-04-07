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

/** Is "a" higher severity than "b"? */
export const compareDangerLevels = (a: DangerLevel | null, b: DangerLevel | null): number => {
	if (a === null && b === null) {
		return 0;
	}

	if (a === null) {
		return -1;
	}

	if (b === null) {
		return 1;
	}

	return DANGER_LEVEL_SEVERITY[a] - DANGER_LEVEL_SEVERITY[b];
};

/** Is "b" higher severity than "a"? */
export const isHigherSeverity = (a: DangerLevel | null, b: DangerLevel | null): boolean =>
	compareDangerLevels(a, b) < 0;

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

export const mapDangerLevelToLabel = (dangerLevel: DangerLevel): string => t(($) => $[dangerLevel]);

export const mapDangerLevelToColor = (dangerLevel: DangerLevel): string => DangerLevels[dangerLevel].color;

export const dangerlevelStyles = {
	danger: {
		bg: "bg-danger",
		bgSubtle: "bg-danger-subtle",
		text: "text-danger-text",
		border: "border-danger-border",
		color: "var(--danger)",
	},
	warning: {
		bg: "bg-warning",
		bgSubtle: "bg-warning-subtle",
		text: "text-warning-text",
		border: "border-warning-border",
		color: "var(--warning)",
	},
	safe: {
		bg: "bg-safe",
		bgSubtle: "bg-safe-subtle",
		text: "text-safe-text",
		border: "border-safe-border",
		color: "var(--safe)",
	},
} satisfies Record<
	DangerLevel,
	{
		bg: string;
		bgSubtle: string;
		text: string;
		border: string;
		color: string;
	}
>;

export function getHighestDangerLevel(operators: Array<UserWithStatusDto>, sensor: Sensor | null): DangerLevel {
	let highestLevel: DangerLevel = "safe";

	operators.forEach((operator) => {
		const level = sensor ? (operator.status[sensor]?.dangerLevel ?? "safe") : operator.status.status;

		if (DANGER_LEVEL_SEVERITY[level] > DANGER_LEVEL_SEVERITY[highestLevel]) {
			highestLevel = level;
		}
	});

	return highestLevel;
}
