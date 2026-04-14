import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useFormatDate } from "@/hooks/use-format-date";
import type { OverviewChartRow } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils.js";
import { setHours, startOfDay } from "date-fns";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, type To } from "react-router";
import { DangerLevelDots } from "./danger-level-dots.js";
import { SensorIcon } from "./sensor-icon.js";

const CELL_SIZE = 10;
const CELL_SIZE_CN = "size-10";

const STICKY = "sticky left-0 z-10 bg-card pl-4";

const getCellAppearance = (dangerLevel: string | null) => {
	const baseClasses = cn(CELL_SIZE_CN, "block rounded-lg border transition-all");

	const clickableClasses = "border-transparent hover:brightness-90 active:scale-[0.98] active:brightness-90";

	switch (dangerLevel) {
		case "danger":
			return {
				className: cn(baseClasses, clickableClasses, "bg-danger text-danger-text"),
				isClickable: true,
			};
		case "warning":
			return {
				className: cn(baseClasses, clickableClasses, "bg-warning text-warning-text"),
				isClickable: true,
			};
		case "safe":
			return {
				className: cn(baseClasses, clickableClasses, "bg-safe text-safe-text"),
				isClickable: true,
			};
		default:
			return {
				className: cn(
					baseClasses,
					"cursor-default border-muted-foreground/20 bg-card text-muted-foreground/50",
				),
				isClickable: false,
			};
	}
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
		<Card className="px-0">
			<CardHeader className="flex flex-row items-center justify-between px-4">
				<div className="ml-auto">{headerRight}</div>
			</CardHeader>

			<CardContent>
				<div className="min-w-0 overflow-x-auto">
					<div
						className="grid w-max gap-x-1.5 gap-y-3 pr-4"
						style={{
							gridTemplateColumns: `auto repeat(${totalHours}, calc(var(--spacing) * ${CELL_SIZE}))`,
						}}
					>
						{/* Empty cell in top-left */}
						<div className={STICKY} />

						{/* Header row */}
						{hours.map((hour) => (
							<div key={`header-${hour}`} className="text-center text-[0.675rem] text-muted-foreground">
								{hourData[hour].timeLabel}
							</div>
						))}

						{/* Data rows */}
						{sensors.map((sensor) => {
							const rowData = dataBySensor[sensor];

							return (
								<Fragment key={sensor}>
									{/* Label for y-axis */}
									<div
										className={cn(
											STICKY,
											"flex items-center gap-2 pr-4 text-muted-foreground text-sm",
										)}
									>
										<SensorIcon type={sensor} size="xs" />
										<p>{t(($) => $.sensors[sensor])}</p>
									</div>

									{/* Hourly grid cells */}
									{hours.map((localHour) => {
										const { timeLabel, utcHour } = hourData[localHour];
										const dangerLevel = rowData?.dangerLevelByHour?.[utcHour];
										const linkTarget = createLink(sensor, dateQueryParam);

										const { className, isClickable } = getCellAppearance(dangerLevel);

										if (!isClickable || linkTarget === null) {
											return (
												<div
													key={`${sensor}-${localHour}`}
													className={className}
													aria-hidden="true"
												/>
											);
										}

										return (
											<Link
												key={`${sensor}-${localHour}`}
												to={linkTarget}
												title={`${timeLabel} - ${dangerLevel}`}
												className="relative"
												aria-label={`View ${sensor} data for ${timeLabel}`}
											>
												<div className={className} />
												<DangerLevelDots
													dangerLevel={dangerLevel ?? null}
													className="absolute right-1 bottom-1"
												/>
											</Link>
										);
									})}
								</Fragment>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
