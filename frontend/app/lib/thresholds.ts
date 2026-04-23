import type { Sensor } from "@/features/sensor-picker/sensors";
import type { SensorTypeField } from "@/lib/dto";

export type Threshold = {
	warning: number;
	danger: number;
	peakDanger: number | null;
};

const thresholds: Record<Sensor, Threshold> = {
	dust: {
		warning: 7.5,
		danger: 15,
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

const dustThresholdOverrides: Partial<Record<SensorTypeField, Threshold>> = {
	pm1_stel: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm25_stel: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm4_stel: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm10_stel: {
		warning: 15,
		danger: 30,
		peakDanger: null,
	},
	pm1_twa: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm25_twa: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm4_twa: {
		warning: 7.5,
		danger: 15,
		peakDanger: null,
	},
	pm10_twa: {
		warning: 15,
		danger: 30,
		peakDanger: null,
	},
};

export function getThreshold(sensor: Sensor, dustField?: SensorTypeField | null): Threshold {
	if (sensor === "dust" && dustField) {
		return dustThresholdOverrides[dustField] ?? thresholds.dust;
	}

	return thresholds[sensor];
}
