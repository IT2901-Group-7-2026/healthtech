import { Skeleton } from "@/components/ui/skeleton";
import { useDate } from "@/features/date-picker/use-date";
import type { Exposure } from "@/features/exposure-picker/exposures";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { getLocale } from "@/i18n/locale";
import { exposureOverviewQueryOptions, exposureQueryOptions } from "@/lib/api";
import { type Aggregation, Aggregations } from "@/lib/dto";
import { buildExposureOverviewQuery, buildExposureQuery } from "@/lib/exposure-query-utils";
import { defaultDustField, exposures, parseAsDustField } from "@/lib/exposures";
import { calculateSummaryCounts } from "@/lib/time-bucket-utils";
import { cn } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { formatDuration, hoursToMinutes, type Locale, minutesToHours } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

type ExposureType = Exposure | "all";

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
	const [dustField] = useQueryState("dustField", parseAsDustField.withDefault(defaultDustField));

	const peakAggregation = aggregation === "peak";

	const exposure = exposureType === "all" ? null : (exposureType as Exposure);

	// Because vibration data is cumulative and has few data points, we never fetch it with minute granularity
	// TODO: When we take vibration disconnectedOn into account we could fetch it with minute granularity for the day
	// view as well
	const granularity = exposure === "vibration" ? "hour" : "minute";

	const exposureQuery =
		exposure &&
		buildExposureQuery(exposure, view, currentDate, {
			usePeakAggregation: peakAggregation,
			granularity,
			field: exposure === "dust" ? dustField : undefined,
		});
	const exposureQueryEnabled = exposure !== null && exposureQuery !== null;

	const [exposureResponse, allExposuresResponse] = useQueries({
		queries: [
			exposureQueryOptions({
				exposure: exposure as NonNullable<typeof exposure>,
				query: exposureQuery as NonNullable<typeof exposureQuery>,
				enabled: exposureQueryEnabled,
				userId: user.id,
			}),
			exposureOverviewQueryOptions({
				query: buildExposureOverviewQuery([...exposures], view, currentDate, {
					usePeakAggregation: peakAggregation,
					granularity,
				}),
				userId: user.id,
				enabled: !exposureQueryEnabled,
			}),
		],
	});

	const response = exposure === null ? allExposuresResponse : exposureResponse;

	const data = response.data
		? calculateSummaryCounts(response.data.data, {
				exposure,
				peakAggregation,
				granularity,
			})
		: null;

	if (data === null) {
		return <SummaryCardSkeleton />;
	}

	const safeLabel = t(($) => $.exposureSummary.aggregated.safe);
	const warningLabel = t(($) => $.exposureSummary.aggregated.warning);
	const dangerLabel = t(($) => $.exposureSummary.aggregated.danger);

	const safeDuration = formatMinutesAsDuration(data.safeMinutes, locale);
	const warningDuration = formatMinutesAsDuration(data.warningMinutes, locale);
	const dangerDuration = formatMinutesAsDuration(data.dangerMinutes, locale);

	return (
		<div className="grid grid-cols-3 gap-3">
			<p
				title={`${safeLabel}: ${safeDuration}`}
				className={cn(
					"flex flex-col rounded-lg px-2 py-1",
					data.safeMinutes > 0 ? "bg-safe-subtle text-safe-text" : "bg-secondary text-muted-foreground",
				)}
			>
				<span className="text-xs">{safeLabel}</span>
				<span className="font-medium text-sm tabular-nums">{safeDuration}</span>
			</p>

			<p
				title={`${warningLabel}: ${warningDuration}`}
				className={cn(
					"flex flex-col rounded-lg px-2 py-1",
					data.warningMinutes > 0
						? "bg-warning-subtle text-warning-text"
						: "bg-secondary text-muted-foreground",
				)}
			>
				<span className="text-xs">{warningLabel}</span>
				<span className="font-medium text-sm tabular-nums">{warningDuration}</span>
			</p>

			<p
				title={`${dangerLabel}: ${dangerDuration}`}
				className={cn(
					"flex flex-col rounded-lg px-2 py-1",
					data.dangerMinutes > 0 ? "bg-danger-subtle text-danger-text" : "bg-secondary text-muted-foreground",
				)}
			>
				<span className="text-xs">{dangerLabel}</span>
				<span className="font-medium text-sm tabular-nums">{dangerDuration}</span>
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

	return formatDuration({ days, hours, minutes: minutes }, { locale, format }).replace("en", "1");
}

function SummaryCardSkeleton() {
	return (
		<div className="grid grid-cols-3 gap-3">
			<Skeleton className="h-11 w-full rounded-xl" />
			<Skeleton className="h-11 w-full rounded-xl" />
			<Skeleton className="h-11 w-full rounded-xl" />
		</div>
	);
}
