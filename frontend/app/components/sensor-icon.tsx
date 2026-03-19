import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import type { ComponentType, SVGProps } from "react";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

import { DustIcon } from "@/components/icons/dust-icon";
import { VibrationIcon } from "@/components/icons/vibration-icon";
import { EarIcon } from "lucide-react";

export type IconVariant = "dust" | "noise" | "vibration";

// TODO: The icons shouldn't have titles we can't change when using SensorIcon. Vibration (EarIcon) also doesn't have a title
const iconConfig: Record<Sensor, { icon: IconType }> = {
	noise: {
		icon: EarIcon,
	},
	dust: {
		icon: DustIcon,
	},
	vibration: {
		icon: VibrationIcon,
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
	dangerLevel?: DangerLevel;
	className?: string;
}

const defaultIconContainerClass =
	"bg-muted text-foreground border border-border";

export const SensorIcon = ({
	type,
	size,
	dangerLevel,
	className,
}: SensorIconProps) => {
	const Icon = iconConfig[type].icon;
	const resolvedIconSize = size ?? "md";
	const dangerLevelIconClasses = dangerLevel
		? cn(
				dangerlevelStyles[dangerLevel].bgSubtle,
				dangerlevelStyles[dangerLevel].text,
				dangerlevelStyles[dangerLevel].border,
			)
		: defaultIconContainerClass;

	return (
		<div
			className={cn(
				"rounded-full border",
				dangerLevelIconClasses,
				className,
			)}
		>
			<Icon className={iconSizeClass[resolvedIconSize]} />
		</div>
	);
};
