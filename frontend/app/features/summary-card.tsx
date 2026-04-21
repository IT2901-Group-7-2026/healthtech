import { Skeleton } from "@/components/ui/skeleton";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { getLocale } from "@/i18n/locale";
import { sensorOverviewQueryOptions, sensorQueryOptions } from "@/lib/api";
import { type Aggregation, Aggregations } from "@/lib/dto";
import { buildSensorOverviewQuery, buildSensorQuery } from "@/lib/sensor-query-utils";
import { sensors } from "@/lib/sensors";
import { calculateSummaryCounts } from "@/lib/time-bucket-utils";
import { cn } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { formatDuration, hoursToMinutes, type Locale, minutesToHours } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

type ExposureType = Sensor | "all";

interface ExposureSummaryProps {
	exposureType: ExposureType;
}

export function ExposureSummary({ exposureType }: ExposureSummaryProps) {
	const { t, i18n } = useTranslation();
	const { view } = useView();
	const currentDate = useDate().date;
	const { user } = useUser();
	const locale = getLocale(i18n.language);

	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation] = useQueryState<Aggregation>("aggregation", parseAsAggregation.withDefault("average"));

	const peakAggregation = aggregation === "peak";

	const sensor = exposureType === "all" ? null : (exposureType as Sensor);

	// Because vibration data is cumulative and has few data points, we never fetch it with minute granularity
	// TODO: When we take vibration disconnectedOn into account we could fetch it with minute granularity for the day
	// view as well
	const granularity = sensor === "vibration" ? "hour" : "minute";

	const sensorQuery =
		sensor && buildSensorQuery(sensor, view, currentDate, { usePeakAggregation: peakAggregation, granularity });
	const sensorQueryEnabled = sensor !== null && sensorQuery !== null;

	const [sensorResponse, allSensorsResponse] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor: sensor as NonNullable<typeof sensor>,
				query: sensorQuery as NonNullable<typeof sensorQuery>,
				enabled: sensorQueryEnabled,
				userId: user.id,
			}),
			sensorOverviewQueryOptions({
				query: buildSensorOverviewQuery([...sensors], view, currentDate, {
					usePeakAggregation: peakAggregation,
					granularity,
				}),
				userId: user.id,
				enabled: !sensorQueryEnabled,
			}),
		],
	});

	const response = sensor === null ? allSensorsResponse : sensorResponse;

	const data = response.data
		? calculateSummaryCounts(response.data.data, { sensor, peakAggregation, granularity })
		: null;

	if (data === null) {
		return <SummaryCardSkeleton />;
	}

	const safeMinutesLabel = `${formatMinutesAsDuration(data.safeMinutes, locale)} ${t(($) => $.exposureSummary.aggregated.safe)}`;
	const warningMinutesLabel = `${formatMinutesAsDuration(data.warningMinutes, locale)} ${t(($) => $.exposureSummary.aggregated.warning)}`;
	const dangerMinutesLabel = `${formatMinutesAsDuration(data.dangerMinutes, locale)} ${t(($) => $.exposureSummary.aggregated.danger)}`;

	return (
		<div className="grid grid-cols-3 items-center gap-2">
			<p
				title={safeMinutesLabel}
				className={cn(
					"h-6 truncate rounded-md px-2 py-1 text-[0.675rem]",
					data.safeMinutes > 0 ? "bg-safe-subtle text-safe" : "bg-card text-muted-foreground",
				)}
			>
				{safeMinutesLabel}
			</p>

			<p
				title={warningMinutesLabel}
				className={cn(
					"h-6 truncate rounded-md px-2 py-1 text-[0.675rem]",
					data.warningMinutes > 0 ? "bg-warning-subtle text-warning" : "bg-card text-muted-foreground",
				)}
			>
				{warningMinutesLabel}
			</p>

			<p
				title={dangerMinutesLabel}
				className={cn(
					"h-6 truncate rounded-md px-2 py-1 text-[0.675rem]",
					data.dangerMinutes > 0 ? "bg-danger-subtle text-danger" : "bg-card text-muted-foreground",
				)}
			>
				{dangerMinutesLabel}
			</p>
		</div>
	);
}

const HOURS_IN_DAY = 24;

function formatMinutesAsDuration(totalMinutes: number, locale: Locale) {
	if (totalMinutes === 0) {
		return formatDuration({ minutes: 0 }, { locale, format: ["minutes"], zero: true });
	}

	const totalHours = minutesToHours(totalMinutes);
	const days = Math.floor(totalHours / HOURS_IN_DAY);
	const hours = totalHours - days * HOURS_IN_DAY;
	const minutes = totalMinutes - hoursToMinutes(totalHours);

	const format: Array<"days" | "hours" | "minutes"> = [];

	if (days > 0) {
		format.push("days");
	}

	if (hours > 0) {
		format.push("hours");
	}

	if (minutes > 0) {
		format.push("minutes");
	}

	return formatDuration({ days, hours, minutes: minutes }, { locale, format });
}

function SummaryCardSkeleton() {
	return (
		<div className="grid grid-cols-3 items-center gap-2">
			<Skeleton className="h-6 w-full" />
			<Skeleton className="h-6 w-full" />
			<Skeleton className="h-6 w-full" />
		</div>
	);
}
