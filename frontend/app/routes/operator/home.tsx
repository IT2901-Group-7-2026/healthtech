/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DailyBarChart } from "@/components/daily-bar-chart";
import { DailyNotes } from "@/components/daily-notes";
import { Summary } from "@/components/summary";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { mapAllSensorDataToMonthLists } from "@/features/calendar-widget/data-transform";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useUser } from "@/features/user-provider.js";
import { useView } from "@/features/views/use-view";
import { ViewSelect } from "@/features/views/view-select";
import { mapAllWeekDataToEvents } from "@/features/week-widget/data-transform";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { getLocale } from "@/i18n/locale";
import { sensorQueryOptions } from "@/lib/api";
import type { AllSensors } from "@/lib/dto";
import { buildSensorQuery } from "@/lib/queries";
import { getNextDay, getPrevDay } from "@/lib/utils";

// biome-ignore lint: page components can be default exports
export default function OperatorHome() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();

	const { view } = useView();
	const translatedView = t(($) => $.overview[view]);
	const { date, setDate } = useDate();

	const { user } = useUser();

	// The overview daily page shows hour granularity for all sensors instead of minute granularity, so we override it here
	const granularity = view === "day" ? "hour" : undefined;

	const sensorQueries = useMemo(
		() =>
			sensors.map((sensor) => ({
				sensor,
				query: buildSensorQuery(sensor, view, date, granularity),
			})),
		[view, date, granularity],
	);

	const results = useQueries({
		queries: sensorQueries.map(({ sensor, query }) =>
			sensorQueryOptions({ sensor, query, userId: user.id }),
		),
	});

	useEffect(() => {
		if (user.role !== "operator") {
			navigate("/");
			return;
		}
	}, [user, navigate]);

	const everySensorData: AllSensors = Object.fromEntries(
		sensors.map((sensor, index) => [
			sensor,
			{
				data: results[index].data,
				isLoading: results[index].isLoading,
				isError: results[index].isError,
			},
		]),
	) as AllSensors;

	const isLoadingAny = Object.values(everySensorData).some(
		(res) => res.isLoading,
	);
	const isErrorAny = Object.values(everySensorData).some(
		(res) => res.isError,
	);

	return (
		<div className="flex w-full flex-col items-center md:items-start">
			<div className="mb-4 flex w-full flex-col items-start gap-2 md:mb-0 md:flex-row md:justify-between">
				<h1 className="p-2 text-3xl">
					{t(($) => $.overview.title, { view: translatedView })}
				</h1>
				<div className="flex flex-row gap-4">
					<Button
						onClick={() => setDate(new Date())}
						size={"icon"}
						className="px-8"
					>
						{t(($) => $.today)}
					</Button>
					<Button
						onClick={() => setDate(getPrevDay(date, view))}
						size={"icon"}
					>
						{"<"}
					</Button>
					<ViewSelect />
					<Button
						onClick={() => setDate(getNextDay(date, view))}
						size={"icon"}
					>
						{">"}
					</Button>
				</div>
			</div>
			<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
				<div className="flex flex-col gap-4 md:w-1/4">
					<Summary exposureType="all" data={everySensorData ?? []} />
					<DailyNotes />
				</div>
				<div className="flex flex-1 flex-col gap-1">
					<div className="view-wrapper w-full">
						<section className="flex w-full flex-col place-items-center gap-4 pb-5">
							{isLoadingAny ? (
								<Card className="flex h-24 w-full items-center">
									<p>{t(($) => $.loadingData)}</p>
								</Card>
							) : isErrorAny ? (
								<Card className="flex h-24 w-full items-center">
									<p>{t(($) => $.errorLoadingData)}</p>
								</Card>
							) : view === "month" ? (
								<CalendarWidget
									selectedDay={date}
									data={mapAllSensorDataToMonthLists(
										everySensorData ?? [],
									)}
								/>
							) : view === "week" ? (
								<WeekWidget
									locale={getLocale(i18n.language)}
									dayStartHour={8}
									dayEndHour={16}
									weekStartsOn={1}
									minuteStep={60}
									events={mapAllWeekDataToEvents(
										everySensorData ?? [],
									)}
								/>
							) : !everySensorData ||
								Object.values(everySensorData).every(
									(sensor) =>
										!sensor.data ||
										sensor.data.length === 0,
								) ? (
								<Card className="flex h-24 w-full items-center">
									<CardTitle>
										{date.toLocaleDateString(
											i18n.language,
											{
												day: "numeric",
												month: "long",
												year: "numeric",
											},
										)}
									</CardTitle>
									<p>{t(($) => $.noData)}</p>
								</Card>
							) : (
								<DailyBarChart
									data={everySensorData}
									chartTitle={date.toLocaleDateString(
										i18n.language,
										{
											day: "numeric",
											month: "long",
											year: "numeric",
										},
									)}
								/>
							)}
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}
