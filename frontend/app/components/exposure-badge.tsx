import { type IconType, sensorIconConfig } from "@/components/icons/sensor-icons";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import { useTranslation } from "react-i18next";

const iconConfig: Record<Sensor, IconType> = sensorIconConfig;

interface ExposureBadgeProps {
	sensor: Sensor;
	dangerLevel?: DangerLevel;
	className?: string;
}

export const ExposureBadge = ({ sensor, dangerLevel, className }: ExposureBadgeProps) => {
	const { t } = useTranslation();

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
			{<Icon title={sensor} className="inline-block h-4 w-4" />}
			<span>{t(($) => $.sensors[sensor])}</span>
		</div>
	);
};
