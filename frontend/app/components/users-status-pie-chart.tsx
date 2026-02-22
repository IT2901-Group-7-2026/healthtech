import { Card, CardContent } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Pie,
	PieChart,
	type PieLabelRenderProps,
	type PieSectorShapeProps,
	Sector,
} from "recharts";

const chartConfig = {
	percent: {
		label: "Percent", //TODO: i18n
	},
	safe: {
		label: "Safe", //TODO: i18n
		color: "var(--safe)",
	},
	warning: {
		label: "Warning", //TODO: i18n
		color: "var(--warning)",
	},
	danger: {
		label: "Danger", //TODO: i18n
		color: "var(--danger)",
	},
} satisfies ChartConfig;

const RADIAN = Math.PI / 180;

const pieLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	value,
}: PieLabelRenderProps) => {
	if (
		cx == null ||
		cy == null ||
		innerRadius == null ||
		outerRadius == null ||
		value === 0
	) {
		return null;
	}
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const ncx = Number(cx);
	const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
	const ncy = Number(cy);
	const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="white"
			textAnchor={x > ncx ? "start" : "end"}
			dominantBaseline="central"
		>
			{value}
		</text>
	);
};

const pieShape = (props: PieSectorShapeProps) => {
	const colorMap: Record<string, string> = {
		Danger: "var(--danger)",
		Warning: "var(--warning)",
		Safe: "var(--safe)",
	};
	const color = (props.name && colorMap[props.name]) || "#ccc";
	return <Sector {...props} fill={color} />;
};

export interface UserStatusData {
	safe: { name: string; value: number; label: string };
	warning: { name: string; value: number; label: string };
	danger: { name: string; value: number; label: string };
}

export function UserStatusPieChart({ safe, warning, danger }: UserStatusData) {
	return (
		<ChartContainer config={chartConfig} className="h-40 w-full">
			<PieChart>
				<Pie
					dataKey={"value"}
					data={[safe, warning, danger]}
					label={pieLabel}
					labelLine={false}
					shape={pieShape}
				/>
				<ChartTooltip
					content={({ active, payload }) => {
						if (!(active && payload?.length)) {
							return null;
						}

						const label = payload[0].name;
						const value = payload[0].value;

						return (
							<div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">{label}</span>
									<span className="font-medium font-mono text-foreground tabular-nums">
										{value}
									</span>
								</div>
							</div>
						);
					}}
				/>
			</PieChart>
		</ChartContainer>
	);
}
