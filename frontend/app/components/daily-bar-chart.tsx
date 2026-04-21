import { Card, CardContent } from "@/components/ui/card";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useFormatDate } from "@/hooks/use-format-date";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels";
import type { OverviewChartRow } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils.js";
import { setHours, startOfDay } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, type To } from "react-router";
import { DangerLevelDots } from "./danger-level-dots.js";
import { SensorIcon } from "./sensor-icon.js";

const getDangerLevelClasses = (dangerLevel: DangerLevel | null) => {
	if (dangerLevel) {
		return cn(dangerlevelStyles[dangerLevel].border, dangerlevelStyles[dangerLevel].bgSubtle);
	}

	return "border-muted-foreground/20";
};

interface DailyBarChartProps {
	data: Array<OverviewChartRow>;
	startHour?: number;
	endHour?: number;
	headerRight?: React.ReactNode;
	buildLink?: (sensor: string, dateQueryParam: string) => To | null;
}

export function DailyBarChart({ data, startHour = 0, endHour = 23, headerRight, buildLink }: DailyBarChartProps) {
	const { t } = useTranslation();
	const { date } = useDate();
	const formatDate = useFormatDate();

	const totalHours = endHour - startHour + 1;

	const hours = useMemo(() => Array.from({ length: totalHours }, (_, i) => startHour + i), [startHour, totalHours]);

	const hourData = useMemo(() => {
		const baseDate = startOfDay(date);

		return hours.reduce<Record<number, { timeLabel: string; utcHour: number }>>((acc, hour) => {
			const hourDate = setHours(baseDate, hour);

			acc[hour] = {
				timeLabel: formatDate(hourDate, "HH:mm"),
				utcHour: hourDate.getUTCHours(),
			};

			return acc;
		}, {});
	}, [hours, date, formatDate]);

	const dateQueryParam = useMemo(() => formatDate(date, "yyyy-MM-dd"), [date, formatDate]);
	const createLink =
		buildLink ??
		((sensor: string, formattedDate: string) => ({
			pathname: sensor,
			search: `?view=Day&date=${formattedDate}`,
		}));

	const dataBySensor = useMemo(
		() =>
			data.reduce<Record<string, OverviewChartRow>>((acc, row) => {
				acc[row.sensor] = row;
				return acc;
			}, {}),
		[data],
	);

	return (
		<Card className="relative p-0">
			{headerRight && <div className="absolute top-2 right-2 z-20 flex items-center gap-2">{headerRight}</div>}

			<CardContent>
				<div className="overflow-x-auto">
					<div className="w-max min-w-full space-y-1">
						{sensors.map((sensor) => {
							const rowData = dataBySensor[sensor];
							const linkTarget = createLink(sensor, dateQueryParam);
							const isLinkable = linkTarget !== null;

							const rowContent = (
								<>
									<div className="sticky left-0 flex w-fit items-center gap-2 px-4 py-3">
										<SensorIcon type={sensor} size="sm" />
										<span className="text-base text-foreground">{t(($) => $.sensors[sensor])}</span>
									</div>

									<div className="flex items-start gap-1.5 px-4 pb-3">
										{hours.map((localHour) => {
											const { timeLabel, utcHour } = hourData[localHour];
											const dangerLevel = rowData?.dangerLevelByHour?.[utcHour];

											return (
												<div
													key={`${sensor}-${localHour}`}
													className="flex shrink-0 flex-col items-center"
												>
													{/* hour slot */}
													<div
														title={`${timeLabel} — ${dangerLevel ?? "no data"}`}
														className={cn(
															"relative block size-12 rounded-lg border transition-all",
															getDangerLevelClasses(dangerLevel ?? null),
														)}
													>
														{dangerLevel && (
															<DangerLevelDots
																dangerLevel={dangerLevel}
																className="absolute right-1 bottom-1"
															/>
														)}
													</div>

													{/* time label */}
													<div className="mt-2 text-center text-muted-foreground text-xs">
														{timeLabel}
													</div>
												</div>
											);
										})}
									</div>
								</>
							);

							if (isLinkable) {
								return (
									<Link
										key={sensor}
										to={linkTarget}
										className={cn(
											"group block rounded-lg transition-colors",
											isLinkable && "hover:bg-card-highlight",
										)}
										aria-label={`View ${t(($) => $.sensors[sensor])} data`}
									>
										{rowContent}
									</Link>
								);
							}

							return (
								<div key={sensor} className="group block rounded-lg transition-colors">
									{rowContent}
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
