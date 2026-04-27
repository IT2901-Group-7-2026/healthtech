import { exposureIconConfig } from "@/components/icons/exposure-icons";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.js";
import type { Exposure } from "@/lib/exposures.js";
import { cn } from "@/lib/utils.js";
import { DangerLevelDots } from "./danger-level-dots.js";

type ExposureIconSize = "xs" | "sm" | "md" | "lg" | "xl";

const iconSizeClass: Record<ExposureIconSize, string> = {
	xs: "p-1 size-6",
	sm: "p-1.5 size-8",
	md: "p-[0.4rem] size-9",
	lg: "p-[0.6rem] size-12",
	xl: "p-3 size-16",
};

interface ExposureIconProps {
	type: Exposure | "all";
	size?: ExposureIconSize;
	dangerLevel?: DangerLevel;
	className?: string;
	iconClassName?: string;
	title?: string;
	inline?: boolean;
}

const defaultIconContainerClass = "bg-muted text-foreground border border-border";

export const ExposureIcon = ({ type, size, dangerLevel, className, iconClassName, title, inline }: ExposureIconProps) => {
	const Icon = exposureIconConfig[type];
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
		<Component className={cn("relative flex h-fit w-fit rounded-full border", dangerLevelIconClasses, className)}>
			<Icon
				className={cn(iconSizeClass[resolvedIconSize], inline && "inline-block", iconClassName)}
				title={title}
			/>
			<DangerLevelDots
				dangerLevel={dangerLevel ?? null}
				horizontal={true}
				className="absolute -right-0.25 -bottom-0.25"
			/>
		</Component>
	);
};
