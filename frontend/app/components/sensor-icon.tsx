import type { Sensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils.js";
import {
	EarIcon,
	type LucideIcon,
	SprayCanIcon,
	VibrateIcon,
} from "lucide-react";
import { Badge } from "./ui/badge.js";

const iconConfig: Record<Sensor, { icon: LucideIcon; className: string }> = {
	noise: {
		icon: EarIcon,
		className: "bg-violet-400/50 dark:bg-violet-600/50",
	},
	dust: {
		icon: SprayCanIcon,
		className: "bg-teal-400/50 dark:bg-teal-600/50",
	},
	vibration: {
		icon: VibrateIcon,
		className: "bg-fuchsia-400/50 dark:bg-fuchsia-600/50",
	},
};

interface SensorIconProps {
	type: Sensor;
	value?: string | number;
	className?: string;
}

export const SensorIcon = ({ type, value, className }: SensorIconProps) => {
	const Icon = iconConfig[type].icon;

	return (
		<div className="flex flex-row items-center gap-1.5">
			<Badge className={cn("p-1", iconConfig[type].className, className)}>
				<Icon className="size-3" />
			</Badge>
			{value !== undefined && (
				<p className="text-muted-foreground text-xs">{value}</p>
			)}
		</div>
	);
};
