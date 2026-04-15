import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import { ReferenceLine } from "recharts";

const getThresholdStrokeDasharray = (dangerLevel: DangerLevel) => (dangerLevel === "danger" ? "8 4" : "4 4");

interface ThresholdLineProps {
	dangerLevel: DangerLevel;
	label?: string;
	hideLineLabel?: boolean;
}

export function ThresholdLine({
	dangerLevel,
	label,
	hideLineLabel,
	...props
}: ThresholdLineProps & ({ y: number } | { x: number })) {
	const y = "y" in props ? props.y : undefined;
	const x = "x" in props ? props.x : undefined;

	const strokeDasharray = getThresholdStrokeDasharray(dangerLevel);
	const color = `var(--${DangerLevels[dangerLevel].color})`;

	return <ReferenceLine x={x} y={y} stroke={color} strokeDasharray={strokeDasharray} />;
}
