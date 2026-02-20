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
	if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
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

interface UserStatusData {
	name: string;
	value: number;
}

interface UserStatusPieChartProps {
	data: UserStatusData[];
	label: string;
}

export function UserStatusPieChart({ data, label }: UserStatusPieChartProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-4">
				<h3 className="text-lg font-semibold capitalize"> {label} </h3>
				<ChartContainer config={chartConfig} className="w-full">
					<PieChart>
						<Pie
							dataKey={"value"}
							data={data}
							label={pieLabel}
							labelLine={false}
							shape={pieShape}
						/>
						<ChartTooltip />
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
