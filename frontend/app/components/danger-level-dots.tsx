import { DANGER_LEVEL_SEVERITY, type DangerLevel } from "@/lib/danger-levels.js";
import { cn } from "@/lib/utils.js";

interface DangerLevelDotsProps {
	dangerLevel: DangerLevel | null;
	horizontal?: boolean;
	className?: string;
}

export function DangerLevelDots({ dangerLevel, className, horizontal = false }: DangerLevelDotsProps) {
	if (dangerLevel === null) {
		return null;
	}

	const dotCount = DANGER_LEVEL_SEVERITY[dangerLevel] + 1;
	const dots = Array.from({ length: dotCount }, () => (
		<div
			key={`dot-${dangerLevel}`}
			className="size-1 rounded-full"
			style={{ backgroundColor: `var(--${dangerLevel}-text)` }}
		/>
	));

	if (dotCount < 3) {
		return (
			<div className={cn("flex", horizontal ? "flex-row gap-0.5" : "flex-col gap-0.5", className)}>{dots}</div>
		);
	}

	return (
		<div className={cn("grid grid-cols-2 justify-items-center gap-0.5", className)}>
			<div className="col-span-2">{dots[0]}</div>
			{dots.slice(1)}
		</div>
	);
}
