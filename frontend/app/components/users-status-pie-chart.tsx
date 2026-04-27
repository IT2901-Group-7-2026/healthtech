import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { type DangerLevel, DangerLevelSchema, dangerlevelStyles } from "@/lib/danger-levels.js";
import { useTranslation } from "react-i18next";
import { Pie, PieChart, type PieLabelRenderProps, type PieSectorShapeProps, Sector } from "recharts";
import { DangerLevelDots } from "./danger-level-dots.js";

const RADIAN = Math.PI / 180;

const pieShape = (props: PieSectorShapeProps) => {
	const color = (props.name && dangerlevelStyles[props.name as DangerLevel].color) || "#ccc";

	return <Sector {...props} fill={color} />;
};

interface Props {
	data: Record<DangerLevel, number>;
	hoverable?: boolean;
}

export function UserStatusPieChart({ data, hoverable }: Props) {
	const { t } = useTranslation();

	const chartData = DangerLevelSchema.options.map((level) => ({
		name: level,
		value: data[level],
		label: t(($) => $.foremanDashboard.overview.statCards[level].label),
	}));

	return (
		<ChartContainer config={{}} className="size-full">
			<PieChart responsive={true} style={{ cursor: hoverable ? "pointer" : undefined }}>
				<Pie
					dataKey={"value"}
					isAnimationActive={false}
					data={chartData}
					labelLine={false}
					shape={pieShape}
					innerRadius="60%"
					outerRadius="100%"
					label={CustomLabel}
				/>
				<ChartTooltip
					content={({ active, payload }) => {
						if (!(active && payload?.length)) {
							return null;
						}

						const level = payload[0].name as DangerLevel;

						const label = t(($) => $.foremanDashboard.overview.statCards[level].label);
						const value = payload[0].value;

						return (
							<div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">{label}</span>
									<span className="font-medium font-mono text-foreground tabular-nums">{value}</span>
								</div>
							</div>
						);
					}}
				/>
			</PieChart>
		</ChartContainer>
	);
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: PieLabelRenderProps) => {
	// Don't render a label if the pie takes up 0% of the chart
	if (percent === 0) {
		return null;
	}

	const sizePx = 10;

	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = Number(cx) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
	const y = Number(cy) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

	const dangerLevelParseResult = DangerLevelSchema.safeParse(name?.toLowerCase());
	const dangerLevel = dangerLevelParseResult.success ? dangerLevelParseResult.data : null;

	return (
		<g transform={`translate(${x},${y})`} className="pointer-events-none relative">
			<foreignObject x={-sizePx / 2} y={-sizePx / 2} width={sizePx} height={sizePx}>
				<DangerLevelDots dangerLevel={dangerLevel} />
			</foreignObject>
		</g>
	);
};
