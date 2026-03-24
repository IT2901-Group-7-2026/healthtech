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

export const dangerlevelStyles = {
	danger: {
		bg: "bg-danger",
		bgSubtle: "bg-danger-subtle",
		text: "text-danger-text",
		border: "border-danger-border",
	},
	warning: {
		bg: "bg-warning",
		bgSubtle: "bg-warning-subtle",
		text: "text-warning-text",
		border: "border-warning-border",
	},
	safe: {
		bg: "bg-safe",
		bgSubtle: "bg-safe-subtle",
		text: "text-safe-text",
		border: "border-safe-border",
	},
} satisfies Record<
	DangerLevel,
	{
		bg: string;
		bgSubtle: string;
		text: string;
		border: string;
	}
>;
