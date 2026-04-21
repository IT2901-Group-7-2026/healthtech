import { DustIcon } from "@/components/icons/dust-icon";
import { NoiseIcon } from "@/components/icons/noise-icon";
import { VibrationIcon } from "@/components/icons/vibration-icon";
import type { Sensor } from "@/lib/sensors.js";
import { ShieldAlertIcon } from "lucide-react";
import type { ComponentType } from "react";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height" | "strokeWidth"> & {
	size?: number | string;
	strokeWidth?: number | string;
	title?: string;
};

export type IconType = ComponentType<IconProps>;

export const sensorIconConfig: Record<Sensor | "all", IconType> = {
	all: ShieldAlertIcon,
	noise: NoiseIcon,
	dust: DustIcon,
	vibration: VibrationIcon,
};
