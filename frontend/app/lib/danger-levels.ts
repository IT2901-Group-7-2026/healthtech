export const DangerTypes: Record<DangerKey, number> = {
	danger: 2,
	warning: 1,
	safe: 0,
} as const;
export const DangerKeys = ["safe", "warning", "danger"] as const;
export type DangerKey = (typeof DangerKeys)[number];

type DangerLevelInfo = {
	label: string;
	color: string;
};

export const DangerLevels: Record<DangerKey, DangerLevelInfo> = {
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
