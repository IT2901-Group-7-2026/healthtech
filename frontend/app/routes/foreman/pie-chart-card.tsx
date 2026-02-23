import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	UserStatusPieChart,
	type UserStatusData,
} from "@/components/users-status-pie-chart";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

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
			className={cn(
				"group flex h-full flex-col justify-between gap-2 border border-white/10 bg-white/5 p-4 transition-colors hover:ring-1",
				"hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/60 hover:ring-zinc-200 active:bg-zinc-50 active:shadow-sm",
				"dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400",
				className,
			)}
		>
			<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
				{label}
			</h2>

			<div className="flex flex-col gap-2 text-xs w-1/3">
				<div className="flex flex-row gap-2 justify-between">
					<p className="dark:text-zinc-400">{data.danger.label}</p>{" "}
					<p>{data.danger.value}</p>
				</div>
				<div className="flex flex-row gap-2 justify-between">
					<p className="dark:text-zinc-400">{data.warning.label}</p>{" "}
					<p>{data.warning.value}</p>
				</div>
				<div className="flex flex-row gap-2 justify-between">
					<p className="dark:text-zinc-400">{data.safe.label}</p>{" "}
					<p>{data.safe.value}</p>
				</div>
			</div>

			<UserStatusPieChart
				safe={data.safe}
				warning={data.warning}
				danger={data.danger}
			/>
			<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
				<p>{viewDetailsText}</p>
				<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</div>
		</Card>
	</Link>
);
