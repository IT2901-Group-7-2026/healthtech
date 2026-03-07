import { InteractiveCard } from "@/components/interactive-card";
import {
	type UserStatusData,
	UserStatusPieChart,
} from "@/components/users-status-pie-chart";
import {
	DANGER_LEVEL_SEVERITY,
	DangerLevelSchema,
	mapDangerLevelToColor,
} from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

export type PieChartCardProps = {
	className?: string;
	to: string;
	label: string;
	data: UserStatusData;
};

export const PieChartCard = ({
	className,
	to,
	label,
	data,
}: PieChartCardProps) => (
	<Link
		to={to}
		className={cn(
			"h-full w-full flex-1 basis-64 rounded-2xl md:last:col-span-2 lg:last:col-span-1",
			className,
		)}
	>
		<InteractiveCard className={className}>
			<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
				{label}
			</h2>
			<div className="flex flex-row items-center gap-2">
				<div className="flex w-1/2 flex-col gap-2 text-xs">
					{DangerLevelSchema.options
						.sort(
							(a, b) =>
								DANGER_LEVEL_SEVERITY[b] -
								DANGER_LEVEL_SEVERITY[a],
						)
						.map((level) => (
							<div
								className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
								key={level}
							>
								<div
									className={`h-3 w-3 rounded-sm bg-${mapDangerLevelToColor(level)}`}
								/>
								<p className="dark:text-zinc-400">
									{data[level].label}
								</p>{" "}
								<p>{data[level].value}</p>
							</div>
						))}
				</div>

				<UserStatusPieChart
					safe={data.safe}
					warning={data.warning}
					danger={data.danger}
				/>
			</div>
		</InteractiveCard>
	</Link>
);
