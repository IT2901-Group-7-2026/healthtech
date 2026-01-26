import type { Sensor } from "@/features/sensor-picker/sensors";

type Threshold = {
	warning: number;
	danger: number;
};

export const thresholds: Record<Sensor, Threshold> = {
	dust: {
		warning: 15,
		danger: 30,
	},
	noise: {
		warning: 80,
		danger: 85,
	},
	vibration: {
		warning: 100,
		danger: 400,
	},
};
