import { dangerlevelStyles, getDangerLevel } from "@/lib/danger-levels.ts";
import { normalizeDangerLevelForPeakForLineChart } from "@/lib/utils.ts";

interface ExposureLineChartGradientStopsProps {
	values: Array<number>;
	warningThreshold: number;
	dangerThreshold: number;
	usePeakData?: boolean;
}

export function ExposureLineChartGradientStops({
	values,
	warningThreshold,
	dangerThreshold,
	usePeakData,
}: ExposureLineChartGradientStopsProps) {
	const minValue = values.length > 0 ? Math.min(...values) : 0;
	const maxValue = values.length > 0 ? Math.max(...values) : 0;

	let minDangerLevel = getDangerLevel(minValue, warningThreshold, dangerThreshold);
	let maxDangerLevel = getDangerLevel(maxValue, warningThreshold, dangerThreshold);

	minDangerLevel = normalizeDangerLevelForPeakForLineChart(minDangerLevel, usePeakData);
	maxDangerLevel = normalizeDangerLevelForPeakForLineChart(maxDangerLevel, usePeakData);

	const uniformDangerLevel = minDangerLevel === maxDangerLevel ? minDangerLevel : undefined;

	const getOffset = (y: number) => {
		if (maxValue === minValue) {
			return "0%";
		}

		return `${((maxValue - y) / (maxValue - minValue)) * 100}%`;
	};

	const dangerOffset = getOffset(dangerThreshold);
	const warningOffset = getOffset(warningThreshold);

	// If all values fall within the same danger level, use a solid color for the line instead of a gradient
	if (uniformDangerLevel) {
		const dangerLevelColor = dangerlevelStyles[uniformDangerLevel].color;
		return (
			<>
				<stop offset="0%" stopColor={dangerLevelColor} />
				<stop offset="100%" stopColor={dangerLevelColor} />
			</>
		);
	}

	return (
		<>
			<stop offset={dangerOffset} stopColor="var(--danger)" />

			{/* Only show the warning gradient for non-peak data */}
			{usePeakData ? (
				<stop offset={dangerOffset} stopColor="var(--safe)" />
			) : (
				<>
					<stop offset={dangerOffset} stopColor="var(--warning)" />
					<stop offset={warningOffset} stopColor="var(--warning)" />
					<stop offset={warningOffset} stopColor="var(--safe)" />
				</>
			)}

			<stop offset="100%" stopColor="var(--safe)" />
		</>
	);
}
