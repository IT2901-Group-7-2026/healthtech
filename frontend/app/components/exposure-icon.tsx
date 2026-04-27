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
	iconOnly?: boolean;
	includeDangerLevelDots?: boolean;
}

export const ExposureIcon = ({
	type,
	size,
	dangerLevel,
	className,
	iconClassName,
	title,
	inline,
	iconOnly,
	includeDangerLevelDots = true,
}: ExposureIconProps) => {
	const Component = inline ? "span" : "div";

	const Icon = exposureIconConfig[type];
	const iconSize = iconSizeClass[size ?? "md"];

	const styles = dangerlevelStyles[dangerLevel ?? "none"];
	const containerClassName = iconOnly ? undefined : cn(styles.text, styles.bgSubtle, styles.border);

	return (
		<Component className={cn("relative flex h-fit w-fit rounded-full", containerClassName, className)}>
			<Icon className={cn(iconSize, inline && "inline-block", iconOnly && "p-0", iconClassName)} title={title} />
			{includeDangerLevelDots && (
				<DangerLevelDots
					dangerLevel={dangerLevel ?? null}
					horizontal={true}
					className="absolute -right-0.25 -bottom-0.25"
				/>
			)}
		</Component>
	);
};
