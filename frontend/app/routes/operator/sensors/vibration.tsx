/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Summary } from "@/components/summary";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { mapSensorDataToMonthLists } from "@/features/calendar-widget/data-transform";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user-provider.js";
import { parseAsView } from "@/features/views/utils";
import { mapWeekDataToEvents } from "@/features/week-widget/data-transform";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { languageToLocale } from "@/i18n/locale";
import { sensorQueryOptions } from "@/lib/api";
import type { SensorDataRequestDto } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import { makeCumulative } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

// biome-ignore lint: page components can be default exports
export default function Vibration() {
	const [view] = useQueryState("view", parseAsView.withDefault("day"));
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();

	const dayQuery: SensorDataRequestDto = {
		startTime: new Date(date.setUTCHours(8)),
		endTime: new Date(date.setUTCHours(16)),
		granularity: "minute",
		function: "max",
	};

	const weekQuery: SensorDataRequestDto = {
		startTime: startOfWeek(date, { weekStartsOn: 1 }),
		endTime: endOfWeek(date, { weekStartsOn: 1 }),
		granularity: "hour",
		function: "max",
	};

	const monthQuery: SensorDataRequestDto = {
		startTime: startOfMonth(date),
		endTime: endOfMonth(date),
		granularity: "day",
		function: "max",
	};

	const query =
		view === "day" ? dayQuery : view === "week" ? weekQuery : monthQuery;

	const { data, isLoading, isError } = useQuery(
		sensorQueryOptions({
			sensor: "vibration",
			query: {
				...query,
				function: "sum",
			},
			userId: user.id,
		}),
	);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/4">
				<Summary
					exposureType={"vibration"}
					data={makeCumulative(data)}
				/>
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
						data={mapSensorDataToMonthLists(
							data ?? [],
							"vibration",
						)}
					/>
				) : view === "week" ? (
					<WeekWidget
						locale={languageToLocale[i18n.language]}
						dayStartHour={8}
						dayEndHour={16}
						weekStartsOn={1}
						minuteStep={60}
						events={mapWeekDataToEvents(makeCumulative(data))}
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
						chartData={makeCumulative(data)}
						chartTitle={date.toLocaleDateString(i18n.language, {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
						unit={t(($) => $.points)}
						startHour={8}
						endHour={16}
						maxY={450}
						lineType="monotone"
					>
						<ThresholdLine
							y={thresholds.vibration.danger}
							dangerLevel="danger"
						/>
						<ThresholdLine
							y={thresholds.vibration.warning}
							dangerLevel="warning"
						/>
					</ChartLineDefault>
				)}
			</div>
		</div>
	);
}
