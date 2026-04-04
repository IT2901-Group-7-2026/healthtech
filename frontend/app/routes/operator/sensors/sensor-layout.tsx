import { DailyNotes } from "@/components/daily-notes";
import { DatePicker } from "@/components/date-picker";
import { SensorIcon } from "@/components/sensor-icon";
import { Summary } from "@/components/summary";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { sensorOverviewQueryOptions, sensorQueryOptions } from "@/lib/api";
import { type Aggregation, Aggregations } from "@/lib/dto";
import { buildSensorOverviewQuery, buildSensorQuery } from "@/lib/sensor-query-utils";
import { toSensor } from "@/lib/sensors";
import { calculateSummaryCounts } from "@/lib/time-bucket-utils";
import { capitalize } from "@/lib/utils";
import { Card } from "@/ui/card";
import { useQueries } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";

export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { pathname } = useLocation();
	const { view } = useView();
	const { user } = useUser();
	const { t } = useTranslation();

	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation] = useQueryState<Aggregation>("aggregation", parseAsAggregation.withDefault("average"));

	const usePeakAggregation = aggregation === "peak";

	// pathname is "/operator" or "/operator/<sensor>"
	const sensor = toSensor(pathname.split("/").at(-1) ?? "");

	const sensorQuery =
		sensor !== null ? buildSensorQuery(sensor, view, date, { granularity: "hour", usePeakAggregation }) : null;
	const sensorQueryEnabled = sensor !== null && sensorQuery !== null;

	const [sensorResponse, allSensorsResponse] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor: sensor as NonNullable<typeof sensor>,
				query: sensorQuery as NonNullable<typeof sensorQuery>,
				userId: user.id,
				enabled: sensorQueryEnabled,
			}),
			sensorOverviewQueryOptions({
				query: buildSensorOverviewQuery([...sensors], view, date),
				userId: user.id,
				enabled: !sensorQueryEnabled,
			}),
		],
	});

	const response = sensor !== null ? sensorResponse : allSensorsResponse;

	return (
		<div
			className="grid w-full gap-6"
			style={{
				// 73 comes from w-65 on DatePicker's Calendar + p-4 on its outer div (so 8 spacings for both sides)
				gridTemplateColumns: "minmax(calc(var(--spacing) * 40), 1fr) minmax(0, 4fr) calc(var(--spacing) * 73)",
				gridTemplateRows: "auto 1fr",
			}}
		>
			<div className="col-span-3 row-start-1 flex flex-col gap-4">
				{sensor ? (
					<div className="flex flex-row items-center gap-3">
						<SensorIcon type={sensor} size="lg" inline={true} className="ml-1" />
						<h1 className="font-medium text-3xl">{capitalize(sensor)}</h1>
					</div>
				) : (
					<h1 className="font-medium text-3xl">Overview</h1>
				)}

				<p>{t(($) => $.viewSelectionText, { view })}</p>
			</div>

			<aside className="col-start-1 row-start-2 flex flex-col gap-4">
				<Summary
					exposureType={sensor ?? "all"}
					view={view}
					data={calculateSummaryCounts(response.data ?? [], sensor ?? undefined, usePeakAggregation)}
					mode={sensor === null ? "sensor" : "count"}
				/>
				<DailyNotes />
			</aside>

			<article className="col-start-2 row-start-2 flex flex-col gap-4">
				<Outlet />
			</article>

			<aside className="col-start-3 row-start-2 flex flex-col gap-4">
				<Card>
					<ViewPicker />
				</Card>

				<Card>
					<DatePicker mode={view} showWeekNumber={true} date={date} onDateChange={setDate} />
				</Card>
			</aside>
		</div>
	);
}
