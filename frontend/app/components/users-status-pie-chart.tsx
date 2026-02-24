import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
	LabelList,
	Pie,
	PieChart,
	type PieSectorShapeProps,
	Sector,
} from "recharts";

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
		<ChartContainer config={{}} className="h-35 w-35">
			<PieChart>
				<Pie
					dataKey={"value"}
					isAnimationActive={false}
					data={[safe, warning, danger]}
					labelLine={false}
					shape={pieShape}
				>
					<LabelList
						dataKey="value"
						position="inside"
						formatter={(label) => {
							// Hide zero-value labels
							if (typeof label === "number" && label === 0) {
								return null;
							}

							return label;
						}}
						fill="white"
						fontSize={14}
						fontWeight={700}
					/>
				</Pie>
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
