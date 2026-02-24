/** biome-ignore-all lint/suspicious/noAlert: We use alert for testing, but will be changed later */

import { DailyNotes } from "@/components/daily-notes";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Summary } from "@/components/summary";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { mapSensorDataToMonthLists } from "@/features/calendar-widget/data-transform";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { mapWeekDataToEvents } from "@/features/week-widget/data-transform";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { getLocale } from "@/i18n/locale";
import { sensorQueryOptions } from "@/lib/api";
import type { SensorDataRequestDto } from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import { thresholds } from "@/lib/thresholds";
import { computeYAxisRange } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useTranslation } from "react-i18next";

// biome-ignore lint/style/noDefaultExport: react router needs default export
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const { user } = useUser();

	const sensor: Sensor = "dust";

	const dayQuery: SensorDataRequestDto = {
		startTime: new Date(date.setUTCHours(8)),
		endTime: new Date(date.setUTCHours(16)),
		granularity: "minute",
		function: "max",
		field: "pm1_twa",
	};

	const weekQuery: SensorDataRequestDto = {
		startTime: startOfWeek(date, { weekStartsOn: 1 }),
		endTime: endOfWeek(date, { weekStartsOn: 1 }),
		granularity: "hour",
		function: "max",
		field: "pm1_twa",
	};

	const monthQuery: SensorDataRequestDto = {
		startTime: startOfMonth(date),
		endTime: endOfMonth(date),
		granularity: "day",
		function: "max",
		field: "pm1_twa",
	};

	const query =
		view === "day" ? dayQuery : view === "week" ? weekQuery : monthQuery;

	const { data, isLoading, isError } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query,
			userId: user.id,
		}),
	);

	const { minY, maxY } = computeYAxisRange(data ?? []);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/4">
				<Summary exposureType={"dust"} data={data} />
				<DailyNotes />
			</div>
			<div className="flex flex-1 flex-col items-end gap-4">
				{isLoading ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.loadingData)}</p>
					</Card>
				) : isError ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.errorLoadingData)}</p>
					</Card>
				) : view === "month" ? (
					<CalendarWidget
						selectedDay={date}
						data={mapSensorDataToMonthLists(data ?? [], "dust") ?? []}
					/>
				) : view === "week" ? (
					<WeekWidget
						locale={getLocale(i18n.language)}
						dayStartHour={8}
						dayEndHour={16}
						weekStartsOn={1}
						minuteStep={60}
						events={mapWeekDataToEvents(data ?? [])}
					/>
				) : !data || data.length === 0 ? (
					<Card className="flex h-24 w-full items-center">
						<CardTitle>
							{date.toLocaleDateString(i18n.language, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</CardTitle>
						<p>{t(($) => $.noData)}</p>
					</Card>
				) : (
					<ChartLineDefault
						chartData={data ?? []}
						chartTitle={date.toLocaleDateString(i18n.language, {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
						unit={t(($) => $.dust_y_axis)}
						startHour={8}
						endHour={16}
						maxY={maxY}
						minY={minY}
						lineType="monotone"
						sensor={sensor}
					>
						<ThresholdLine y={thresholds.dust.danger} dangerLevel="danger" />
						<ThresholdLine y={thresholds.dust.warning} dangerLevel="warning" />
					</ChartLineDefault>
				)}
			</div>
		</div>
	);
}
