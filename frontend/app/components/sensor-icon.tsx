import { DustIcon } from "@/components/icons/dust-icon";
import { VibrationIcon } from "@/components/icons/vibration-icon";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import { ShieldAlertIcon } from "lucide-react";
import type { ComponentType } from "react";
import { NoiseIcon } from "./icons/noise-icon";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height" | "strokeWidth"> & {
	size?: number | string;
	strokeWidth?: number | string;
	title?: string;
};

type IconType = ComponentType<IconProps>;

// TODO: The icons shouldn't have titles we can't change when using SensorIcon. Vibration (EarIcon) also doesn't have a title
const iconConfig: Record<Sensor | "all", IconType> = {
	all: ShieldAlertIcon,
	noise: NoiseIcon,
	dust: DustIcon,
	vibration: VibrationIcon,
};

type SensorIconSize = "xs" | "sm" | "md" | "lg" | "xl";

const iconSizeClass: Record<SensorIconSize, string> = {
	xs: "p-1 size-6",
	sm: "p-1.5 size-8",
	md: "p-[0.4rem] size-9",
	lg: "p-[0.6rem] size-12",
	xl: "p-3 size-16",
};

interface SensorIconProps {
	type: Sensor | "all";
	size?: SensorIconSize;
	dangerLevel?: DangerLevel;
	className?: string;
	iconClassName?: string;
	title?: string;
	inline?: boolean;
}

const defaultIconContainerClass = "bg-muted text-foreground border border-border";

export const SensorIcon = ({ type, size, dangerLevel, className, iconClassName, title, inline }: SensorIconProps) => {
	const Icon = iconConfig[type];
	const Component = inline ? "span" : "div";

	const resolvedIconSize = size ?? "md";
	const dangerLevelIconClasses = dangerLevel
		? cn(
				dangerlevelStyles[dangerLevel].bgSubtle,
				dangerlevelStyles[dangerLevel].text,
				dangerlevelStyles[dangerLevel].border,
			)
		: defaultIconContainerClass;

	return (
		<Component className={cn("h-fit w-fit rounded-full border", dangerLevelIconClasses, className)}>
			<Icon
				className={cn(iconSizeClass[resolvedIconSize], inline && "inline-block", iconClassName)}
				title={title}
			/>
		</Component>
	);
};
