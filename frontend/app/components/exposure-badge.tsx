import { type IconType, exposureIconConfig } from "@/components/icons/exposure-icons";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Exposure } from "@/lib/exposures.js";
import { cn } from "@/lib/utils.js";
import type { PropsWithChildren } from "react";

const iconConfig: Record<Exposure, IconType> = exposureIconConfig;

interface ExposureBadgeProps extends PropsWithChildren {
	exposure: Exposure;
	dangerLevel: DangerLevel;
	className?: string;
}

export const ExposureBadge = ({ exposure, dangerLevel, className, children }: ExposureBadgeProps) => {
	const Icon = iconConfig[exposure];

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
			<Icon title={exposure} className="inline-block h-4 w-4" />
			{children}
		</div>
	);
};
