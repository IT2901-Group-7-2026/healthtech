import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useFormatDate } from "@/hooks/use-format-date";
import type { OverviewChartRow } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils.js";
import { SensorIcon } from "./sensor-icon.js";

const CELL_SIZE = 10;
const CELL_SIZE_CN = "size-10";

const STICKY = "sticky left-0 z-10 bg-card pl-4";

const getUtcHour = (localHour: number, offsetHours: number): number => {
	return (((localHour - offsetHours) % 24) + 24) % 24;
};

const getCellAppearance = (dangerLevel: string | null) => {
	const baseClasses = cn(
		CELL_SIZE_CN,
		"block rounded-lg border transition-all",
	);

	const clickableClasses =
		"border-transparent hover:brightness-90 active:scale-[0.98] active:brightness-90";

	switch (dangerLevel) {
		case "danger":
			return {
				className: cn(
					baseClasses,
					clickableClasses,
					"bg-danger text-danger-text",
				),
				isClickable: true,
			};
		case "warning":
			return {
				className: cn(
					baseClasses,
					clickableClasses,
					"bg-warning text-warning-text",
				),
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
					"border-muted-foreground/20 bg-card cursor-default text-muted-foreground/50",
				),
				isClickable: false,
			};
	}
};

interface DailyBarChartProps {
	data: Array<OverviewChartRow>;
	chartTitle: string;
	startHour?: number;
	endHour?: number;
	headerRight?: React.ReactNode;
}

export function DailyBarChart({
	data,
	chartTitle,
	startHour = 0,
	endHour = 23,
	headerRight,
}: DailyBarChartProps) {
	const { t } = useTranslation();
	const { date } = useDate();
	const formatDate = useFormatDate();

	const totalHours = endHour - startHour + 1;

	const hours = useMemo(
		() => Array.from({ length: totalHours }, (_, i) => startHour + i),
		[startHour, totalHours],
	);

	const formattedHours = useMemo(() => {
		return hours.reduce<Record<number, string>>((acc, hour) => {
			const hourDate = new Date(date);
			hourDate.setHours(hour, 0, 0, 0);
			acc[hour] = formatDate(hourDate, "HH:mm");
			return acc;
		}, {});
	}, [hours, date, formatDate]);

	// Memoize the query param date so we aren't calling date-fns on every single grid cell
	const dateQueryParam = useMemo(
		() => formatDate(date, "yyyy-MM-dd"),
		[date, formatDate],
	);

	const dataBySensor = useMemo(() => {
		return data.reduce<Record<string, OverviewChartRow>>((acc, row) => {
			acc[row.sensor] = row;
			return acc;
		}, {});
	}, [data]);

	const utcOffsetHours = useMemo(() => {
		const utcNoon = new Date(
			Date.UTC(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				12,
				0,
				0,
				0,
			),
		);
		return Number(formatDate(utcNoon, "H")) - 12;
	}, [date, formatDate]);

	return (
		<Card className="px-0">
			<CardHeader className="flex flex-row items-center justify-between px-4">
				<CardTitle className="text-base">{chartTitle}</CardTitle>
				{headerRight}
			</CardHeader>

			<CardContent>
				<div className="min-w-0 overflow-x-auto">
					<div
						className="grid gap-x-1.5 gap-y-3 w-max pr-4"
						style={{
							gridTemplateColumns: `auto repeat(${totalHours}, calc(var(--spacing) * ${CELL_SIZE}))`,
						}}
					>
						{/* Empty cell in top-left */}
						<div className={STICKY} />

						{/* Header row */}
						{hours.map((hour) => (
							<div
								key={`header-${hour}`}
								className="text-center text-[0.675rem] text-muted-foreground"
							>
								{formattedHours[hour]}
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
											"flex items-center gap-2 pr-4 text-sm text-muted-foreground",
										)}
									>
										<SensorIcon type={sensor} size="xs" />
										<p>{t(($) => $.overview[sensor])}</p>
									</div>

									{/* Hourly grid cells */}
									{hours.map((localHour) => {
										const timeLabel = formattedHours[localHour];
										const utcHour = getUtcHour(localHour, utcOffsetHours);
										const dangerLevel = rowData?.dangerLevelByHour?.[utcHour];

										const { className, isClickable } =
											getCellAppearance(dangerLevel);

										if (!isClickable) {
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
												to={{
													pathname: sensor,
													search: `?view=Day&date=${dateQueryParam}`,
												}}
												title={`${timeLabel} - ${dangerLevel}`}
												className={className}
												aria-label={`View ${sensor} data for ${timeLabel}`}
											/>
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
