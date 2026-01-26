export const dangerTypes: Record<DangerKey, number> = {
	danger: 2,
	warning: 1,
	safe: 0,
} as const;
export const dangerKeys = ["safe", "warning", "danger"] as const;
export type DangerKey = (typeof dangerKeys)[number];

type DangerLevelInfo = {
	label: string;
	color: string;
};

export const dangerLevels: Record<DangerKey, DangerLevelInfo> = {
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
