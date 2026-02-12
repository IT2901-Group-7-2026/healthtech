import { t } from "i18next";
import z from "zod";

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
