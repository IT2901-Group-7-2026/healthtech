import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import type { ComponentType, SVGProps } from "react";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

import { DustIcon } from "@/components/icons/dust-icon";
import { VibrationIcon } from "@/components/icons/vibration-icon";
import { EarIcon } from "lucide-react";

export type IconVariant = "dust" | "noise" | "vibration";

const iconConfig: Record<Sensor, { icon: IconType; className: string }> = {
	noise: {
		icon: EarIcon,
		className: "bg-violet-400/50 dark:bg-violet-600/50",
	},
	dust: {
		icon: DustIcon,
		className: "bg-teal-400/50 dark:bg-teal-600/50",
	},
	vibration: {
		icon: VibrationIcon,
		className: "bg-fuchsia-400/50 dark:bg-fuchsia-600/50",
	},
};

type SensorIconSize = "sm" | "md" | "lg" | "xl";

const iconSizeClass: Record<SensorIconSize, string> = {
	sm: "p-1.5 size-8",
	md: "p-[0.4rem] size-9",
	lg: "p-[0.6rem] size-12",
	xl: "p-3 size-16",
};

interface SensorIconProps {
	type: Sensor;
	size?: SensorIconSize;
	className?: string;
}

export const SensorIcon = ({ type, size, className }: SensorIconProps) => {
	const Icon = iconConfig[type].icon;
	const resolvedSize = size ?? "md";

	return (
		<div
			className={cn(
				"rounded-full",
				iconConfig[type].className,
				className,
			)}
		>
			<Icon className={iconSizeClass[resolvedSize]} />
		</div>
	);
};
