import { dangerlevelStyles, getDangerLevel } from "@/lib/danger-levels";
import { normalizeDangerLevelForPeakForLineChart } from "@/lib/utils";
import type { ActiveDotProps } from "recharts";

type Props = ActiveDotProps & { warning: number; danger: number };

export const ExposureDot = ({ cx, cy, value, warning, danger, isPeak }: Props & { isPeak?: boolean }) => {
	let dangerLevel = getDangerLevel(value, warning, danger);

	dangerLevel = normalizeDangerLevelForPeakForLineChart(dangerLevel, isPeak);

	const fillColor = dangerlevelStyles[dangerLevel].color;

	return <circle cx={cx} cy={cy} r={6} fill={fillColor} />;
};
