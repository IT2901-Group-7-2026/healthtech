import { DustIcon } from "@/components/icons/dust-icon.tsx";
import { NoiseIcon } from "@/components/icons/noise-icon.tsx";
import { VibrationIcon } from "@/components/icons/vibration-icon.tsx";
import type { Exposure } from "@/lib/exposures.ts";
import { ShieldAlertIcon } from "lucide-react";
import type { ComponentType } from "react";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height" | "strokeWidth"> & {
	size?: number | string;
	strokeWidth?: number | string;
	title?: string;
};

export type IconType = ComponentType<IconProps>;

export const exposureIconConfig: Record<Exposure | "all", IconType> = {
	all: ShieldAlertIcon,
	noise: NoiseIcon,
	dust: DustIcon,
	vibration: VibrationIcon,
};
