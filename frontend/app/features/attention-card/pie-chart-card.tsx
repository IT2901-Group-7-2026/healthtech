import { ExposureIcon } from "@/components/exposure-icon.tsx";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card.tsx";
import { UserStatusPieChart } from "@/components/users-status-pie-chart.tsx";
import type { Exposure } from "@/features/exposure-picker/exposures.ts";
import {
	DANGER_LEVEL_SEVERITY,
	type DangerLevel,
	DangerLevelSchema,
	dangerlevelStyles,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.ts";
import { cn } from "@/lib/utils.ts";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export type PieChartCardProps = {
	className?: string;
	to: string;
	label: string;
	data: Record<DangerLevel, number>;
	exposureType: Exposure;
};

export const PieChartCard = ({ className, to, label, data, exposureType }: PieChartCardProps) => {
	const { t } = useTranslation();

	const hasData = DangerLevelSchema.options.some((level) => data[level] && data[level] > 0);

	if (!hasData) {
		return (
			<Card hoverable={true} className={cn("h-full gap-4", className)}>
				<CardHeader className="text-sm">
					<h2 className="flex items-center gap-3 text-sm uppercase tracking-wide">
						<ExposureIcon type={exposureType} size="sm" />
						{label}
					</h2>
				</CardHeader>
				<CardContent className="h-full">
					<p className="text-muted-foreground">{t(($) => $.foremanDashboard.overview.pieChart.noData)}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Link to={to} className={className}>
			<Card hoverable={true} className={cn("h-full gap-3 px-3 pt-3", className)}>
				<CardHeader className="text-sm">
					<h2 className="flex items-center gap-3 text-sm uppercase tracking-wide">
						<ExposureIcon type={exposureType} size="sm" />
						{label}
					</h2>
				</CardHeader>
				<CardContent className="grid flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] grid-rows-[1fr_auto] gap-x-3 gap-y-2">
					<div className="row-span-2 flex flex-col justify-center gap-2 text-xs">
						{DangerLevelSchema.options
							.toSorted((a, b) => DANGER_LEVEL_SEVERITY[b] - DANGER_LEVEL_SEVERITY[a])
							.map((level) => (
								<div key={level}>
									<div className={`${dangerlevelStyles[level].border} border-l-4 pl-1.5`}>
										<p className="pb-1 text-neutral-500 text-xs dark:text-zinc-400">
											{t(($) => $.foremanDashboard.overview.statCards[level].label)}
										</p>
										<p
											className={`text-2xl tabular-nums leading-6 text-${mapDangerLevelToColor(level)}`}
										>
											{data[level]}
										</p>
									</div>
								</div>
							))}
					</div>
					<div className="min-h-0">
						<UserStatusPieChart data={data} hoverable={true} />
					</div>
					<CardFooter className="justify-end gap-1 self-end pr-1 text-muted-foreground text-xs">
						<p>{t(($) => $.interactiveCard.viewDetails)}</p>
						<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
					</CardFooter>
				</CardContent>
			</Card>
		</Link>
	);
};
