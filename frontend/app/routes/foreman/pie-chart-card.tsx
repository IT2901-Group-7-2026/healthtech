import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
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

export type PieChartCardProps = {
	className?: string;
	to: string;
	label: string;
	viewDetailsText: string;
	data: UserStatusData;
};

export const PieChartCard = ({
	className,
	to,
	label,
	viewDetailsText,
	data,
}: PieChartCardProps) => (
	<Link
		to={to}
		className={cn(
			"h-full w-full flex-1 basis-64 rounded-2xl md:last:col-span-2 lg:last:col-span-1",
			className,
		)}
	>
		<Card
			hoverable
			className={cn(
				"group flex h-full flex-col justify-between gap-2",
				className,
			)}
		>
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
			<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
				<p>{viewDetailsText}</p>
				<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</div>
		</Card>
	</Link>
);
