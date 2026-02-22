import type { Sensor } from "@/features/sensor-picker/sensors";

type Threshold = {
	warning: number;
	danger: number;
	peakDanger: number | null;
};

export const thresholds: Record<Sensor, Threshold> = {
	dust: {
		warning: 15,
		danger: 30,
		peakDanger: null,
	},
	noise: {
		warning: 80,
		danger: 85,
		peakDanger: 130,
	},
	vibration: {
		warning: 100,
		danger: 400,
		peakDanger: null,
	},
};
