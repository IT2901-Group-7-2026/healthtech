import { DustIcon } from "@/components/icons/dust-icon";
import { VibrationIcon } from "@/components/icons/vibration-icon";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { NoiseIcon } from "./icons/noise-icon";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height" | "strokeWidth"> & {
	size?: number | string;
	strokeWidth?: number | string;
	title?: string;
};

type IconType = ComponentType<IconProps>;

const iconConfig: Record<Sensor, IconType> = {
	noise: NoiseIcon,
	dust: DustIcon,
	vibration: VibrationIcon,
};

interface ExposureBadgeProps {
	sensor: Sensor;
	dangerLevel?: DangerLevel;
	className?: string;
	title?: string;
	inline?: boolean;
}

const defaultBadgeClasses = "bg-muted text-foreground border border-border";

export const ExposureBadge = ({ sensor, dangerLevel, className }: ExposureBadgeProps) => {
	const Icon = sensor ? iconConfig[sensor] : null;

	const { t } = useTranslation();

	const dangerLevelClasses = dangerLevel
		? cn(
				dangerlevelStyles[dangerLevel].bgSubtle,
				dangerlevelStyles[dangerLevel].text,
				dangerlevelStyles[dangerLevel].border,
			)
		: defaultBadgeClasses;

	return (
		<div
			className={cn("flex items-center gap-1.5 rounded-full border px-1.5 py-0.5", dangerLevelClasses, className)}
		>
			{Icon && <Icon title={sensor} className="inline-block h-4 w-4" />}
			<span>{t(($) => $.sensors[sensor])}</span>
		</div>
	);
};
