import { DANGER_LEVEL_SEVERITY, type DangerLevel } from "@/lib/danger-levels.ts";
import { cn } from "@/lib/utils.ts";

interface DangerLevelDotsProps {
	dangerLevel: DangerLevel | null;
	horizontal?: boolean;
	className?: string;
	size?: "sm" | "md";
}

export function DangerLevelDots({ dangerLevel, className, horizontal = false, size = "md" }: DangerLevelDotsProps) {
	if (dangerLevel === null) {
		return null;
	}

	const dotCount = DANGER_LEVEL_SEVERITY[dangerLevel] + 1;

	const gap = size === "sm" ? "gap-0.25" : "gap-0.5";

	if (dotCount === 1) {
		return (
			<div className={className}>
				<Dot dangerLevel={dangerLevel} />
			</div>
		);
	}

	if (dotCount === 2) {
		return (
			<div className={cn("flex", horizontal ? "flex-row" : "flex-col", gap, className)}>
				<Dot dangerLevel={dangerLevel} />
				<Dot dangerLevel={dangerLevel} />
			</div>
		);
	}

	return (
		<div className={cn("grid grid-cols-2 justify-items-center", gap, className)}>
			<Dot dangerLevel={dangerLevel} className="col-span-2" />
			<Dot dangerLevel={dangerLevel} />
			<Dot dangerLevel={dangerLevel} />
		</div>
	);
}

function Dot({ dangerLevel, className }: { dangerLevel: DangerLevel; className?: string }) {
	return (
		<div
			className={cn("size-1 rounded-full", className)}
			style={{ backgroundColor: `var(--${dangerLevel}-text)` }}
		/>
	);
}
