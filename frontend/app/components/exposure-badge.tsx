import { type IconType, sensorIconConfig } from "@/components/icons/sensor-icons";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import type { PropsWithChildren } from "react";

const iconConfig: Record<Sensor, IconType> = sensorIconConfig;

interface ExposureBadgeProps extends PropsWithChildren {
	sensor: Sensor;
	dangerLevel: DangerLevel;
	className?: string;
}

export const ExposureBadge = ({ sensor, dangerLevel, className, children }: ExposureBadgeProps) => {
	const Icon = iconConfig[sensor];

	const dangerLevelClasses = dangerLevel
		? cn(
				dangerlevelStyles[dangerLevel].bgSubtle,
				dangerlevelStyles[dangerLevel].text,
				dangerlevelStyles[dangerLevel].border,
			)
		: "bg-muted text-foreground border border-border";

	return (
		<div
			className={cn(
				"flex h-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-sm",
				dangerLevelClasses,
				className,
			)}
		>
			<Icon title={sensor} className="inline-block h-4 w-4" />
			{children}
		</div>
	);
};
