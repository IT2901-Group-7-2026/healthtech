import { SensorIcon } from "@/components/sensor-icon";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	type UserStatusData,
	UserStatusPieChart,
} from "@/components/users-status-pie-chart";
import type { Sensor } from "@/features/sensor-picker/sensors";
import {
	DANGER_LEVEL_SEVERITY,
	DangerLevelSchema,
	mapDangerLevelToColor,
} from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export type PieChartCardProps = {
	className?: string;
	to: string;
	label: string;
	data: UserStatusData;
	sensorType: Sensor;
};

export const PieChartCard = ({
	className,
	to,
	label,
	data,
	sensorType,
}: PieChartCardProps) => {
	const { t } = useTranslation();

	return (
		<Link
			to={to}
			className={cn(
				"h-full w-full flex-1 basis-64 rounded-2xl md:last:col-span-2 lg:last:col-span-1",
				className,
			)}
		>
			<Card hoverable className={cn("h-full gap-4", className)}>
				<CardHeader className="text-sm">
					<h2 className="flex items-center gap-3 text-sm uppercase tracking-wide">
						<SensorIcon type={sensorType} size="sm" />
						{label}
					</h2>
				</CardHeader>

				{data.danger.value !== 0 ||
				data.safe.value !== 0 ||
				data.warning.value !== 0 ? (
					<CardContent className="flex flex-row items-center gap-0">
						<div className="flex w-1/2 flex-col gap-2 text-xs">
							{DangerLevelSchema.options
								.sort(
									(a, b) =>
										DANGER_LEVEL_SEVERITY[b] -
										DANGER_LEVEL_SEVERITY[a],
								)
								.map((level) => (
									<div key={level}>
										<div
											className={`border-l-${mapDangerLevelToColor(level)} border-l-4 pl-1.5`}
										>
											<div>
												<p className="pb-1 text-neutral-500 text-xs dark:text-zinc-400">
													{data[level].label}
												</p>
												<p
													className={`text-2xl tabular-nums leading-6 text-${mapDangerLevelToColor(level)}`}
												>
													{data[level].value}
												</p>
											</div>
										</div>
									</div>
								))}
						</div>

						<UserStatusPieChart
							safe={data.safe}
							warning={data.warning}
							danger={data.danger}
						/>
					</CardContent>
				) : (
					<CardContent className="h-full">
						{t(($) => $.foremanDashboard.overview.pieChart.noData)}
					</CardContent>
				)}

				<CardFooter className="gap-1 text-muted-foreground text-xs">
					<p>{t(($) => $.interactiveCard.viewDetails)}</p>
					<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
				</CardFooter>
			</Card>
		</Link>
	);
};
