import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { ExposureSlider } from "@/components/exposure-slider";
import { NotesCard } from "@/components/notes-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { BaseExposureLineChartCard } from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { SecurityRegulationsCard } from "@/features/security-regulations-card/security-regulations-card";
import { useUser } from "@/features/user/user-context";
import { useFormatDate } from "@/hooks/use-format-date";
import { exposureQueryOptions } from "@/lib/api";
import { today as getToday, now, toTZDate } from "@/lib/date";
import type { ExposureDto, ExposureTypeField } from "@/lib/dto";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { ExposureUnit } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange, DUST_Y_AXIS_STEP } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQueries } from "@tanstack/react-query";
import { addMinutes, isWithinInterval, startOfDay, startOfMinute } from "date-fns";
import { Clock } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CurveType } from "recharts/types/shape/Curve";

type TimeRangeOption = "30" | "60" | "180" | "480";
const parseTimeRange = parseAsStringLiteral(["30", "60", "180", "480"]);

const TIME_RANGE_MINUTES: Record<TimeRangeOption, number> = {
	"30": 30,
	"60": 60,
	"180": 180,
	"480": 480,
};

export default function OperatorLiveView() {
	const { user } = useUser();
	const [selectedUserId] = useQueryState("userId", parseAsString);
	const { t, i18n } = useTranslation();
	const formatDate = useFormatDate();

	const today = getToday();

	const [timeRange, setTimeRange] = useQueryState<TimeRangeOption>("timeRange", parseTimeRange.withDefault("30"));

	const targetUserId = selectedUserId ?? user.id;

	const timeRangeInMinutes = TIME_RANGE_MINUTES[timeRange];

	const startOfCurrentMinute = startOfMinute(now());
	const end = startOfCurrentMinute;
	const start = addMinutes(startOfCurrentMinute, -timeRangeInMinutes);

	const [dustTwa1Result, dustTwa25Result, dustTwa10Result, noiseResult, vibrationResult] = useQueries({
		queries: [
			exposureQueryOptions({
				exposure: "dust",
				query: buildExposureQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm1_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
				queryKind: "windowed",
				windowMinutes: timeRangeInMinutes,
			}),
			exposureQueryOptions({
				exposure: "dust",
				query: buildExposureQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm25_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
				queryKind: "windowed",
				windowMinutes: timeRangeInMinutes,
			}),
			exposureQueryOptions({
				exposure: "dust",
				query: buildExposureQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm10_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
				queryKind: "windowed",
				windowMinutes: timeRangeInMinutes,
			}),
			exposureQueryOptions({
				exposure: "noise",
				query: buildExposureQuery("noise", "day", end, {
					granularity: "minute",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
				queryKind: "windowed",
				windowMinutes: timeRangeInMinutes,
			}),
			exposureQueryOptions({
				exposure: "vibration",
				query: buildExposureQuery("vibration", "day", end, {
					granularity: "minute",
					startTime: toTZDate(startOfDay(start)),
					endTime: end,
				}),
				userId: targetUserId,
				queryKind: "windowed",
				windowMinutes: timeRangeInMinutes,
			}),
		],
	});

	const dustTwa1Data = dustTwa1Result.data?.data ?? [];
	const dustTwa25Data = dustTwa25Result.data?.data ?? [];
	const dustTwa10Data = dustTwa10Result.data?.data ?? [];
	const noiseData = noiseResult.data?.data ?? [];
	const rawVibrationData = vibrationResult.data?.data ?? [];

	// Since vibration is cumulative over the day we have to fetch data from the start of the day and then filter it to the selected time range
	const vibrationData = useMemo(() => {
		if (!rawVibrationData) {
			return [];
		}

		return rawVibrationData.filter((d) => isWithinInterval(d.time, { start, end }));
	}, [rawVibrationData, start, end]);

	const formattedDate = formatDate(today, i18n.language === "en" ? "MMM d, yyyy" : "d. MMM yyyy");

	return (
		<div
			className="flex w-full flex-col gap-4 md:grid"
			style={{
				gridTemplateColumns: "minmax(calc(var(--spacing) * 40), 1fr) minmax(0, 3fr) calc(var(--spacing) * 73)",
			}}
		>
			<aside className="flex flex-col gap-4 md:col-start-1">
				<SecurityRegulationsCard />
				<NotesCard />
			</aside>

			<div className="flex min-w-0 flex-col gap-4 md:col-start-2">
				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.exposures.dust)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							exposure="dust"
							exposureLabel="PM1 TWA"
							exposureUnitLabel="µg/m³"
							chartUnit="ug"
							data={dustTwa1Data}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							exposure="dust"
							exposureLabel="PM2.5 TWA"
							exposureField="pm25_twa"
							exposureUnitLabel="µg/m³"
							chartUnit="ug"
							data={dustTwa25Data}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							exposure="dust"
							exposureLabel="PM10 TWA"
							exposureField="pm10_twa"
							exposureUnitLabel="µg/m³"
							chartUnit="ug"
							data={dustTwa10Data}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
							showLegend={true}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.exposures.noise)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							exposure="noise"
							exposureLabel={t(($) => $.exposures.noise)}
							exposureUnitLabel="dB"
							chartUnit="dbTwa"
							data={noiseData}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
							showLegend={true}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.exposures.vibration)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							exposure="vibration"
							exposureLabel={t(($) => $.exposures.vibration)}
							exposureUnitLabel={t(($) => $.exposures.units.points)}
							chartUnit="points"
							data={vibrationData}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
							showLegend={true}
							lineType="monotone"
						/>
					</CardContent>
				</Card>
			</div>

			<aside className="md:col-start-3">
				<Card muted={true} className="flex flex-col gap-4">
					<div className="flex w-full flex-row justify-between">
						<p className="flex items-center gap-2 text-sm">
							<Clock size="1rem" />
							{t(($) => $.live.timeRange.label)}
						</p>
						<p className="text-sm">{formattedDate}</p>
					</div>
					<ToggleGroup
						type="single"
						value={timeRange}
						variant="outline"
						onValueChange={(value: TimeRangeOption | "") => {
							if (value) {
								setTimeRange(value);
							}
						}}
					>
						<ToggleGroupItem
							className="text-xs"
							value="30"
							aria-label={t(($) => $.live.timeRange.options.thirtyMinutes)}
						>
							<p>{t(($) => $.live.timeRange.options.thirtyMinutes)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="60"
							aria-label={t(($) => $.live.timeRange.options.oneHour)}
						>
							<p>{t(($) => $.live.timeRange.options.oneHour)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="180"
							aria-label={t(($) => $.live.timeRange.options.threeHours)}
						>
							<p>{t(($) => $.live.timeRange.options.threeHours)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="480"
							aria-label={t(($) => $.live.timeRange.options.eightHours)}
						>
							<p>{t(($) => $.live.timeRange.options.eightHours)}</p>
						</ToggleGroupItem>
					</ToggleGroup>
				</Card>
			</aside>
		</div>
	);
}

interface LiveExposureCardProps {
	exposure: "dust" | "noise" | "vibration";
	exposureLabel: string;
	exposureField?: ExposureTypeField;
	exposureUnitLabel: string;
	chartUnit: ExposureUnit;
	data: Array<ExposureDto>;
	minTime: TZDate;
	maxTime: TZDate;
	chartClassName?: string;
	showLegend?: boolean;
	lineType?: CurveType;
}

const LiveExposureCard = ({
	exposure,
	exposureLabel,
	exposureField,
	exposureUnitLabel,
	chartUnit,
	minTime,
	data,
	maxTime,
	chartClassName,
	showLegend = false,
	lineType,
}: LiveExposureCardProps) => {
	const maxValue = Math.max(...data.map((d) => d.value));

	const minY = 0;
	let maxY = exposure === "vibration" ? 450 : exposure === "noise" ? 150 : 45;
	if (maxValue > maxY) {
		maxY =
			exposure === "dust"
				? computeYAxisRange(data ?? [], {
						step: DUST_Y_AXIS_STEP,
						topPadding: DUST_Y_AXIS_STEP,
					}).maxY
				: computeYAxisRange(data ?? []).maxY;
	}

	const threshold = getThreshold(exposure, exposureField);
	const latestData = data.at(-1);
	const latestValue = latestData?.value;
	const latestDangerLevel = latestData?.dangerLevel;

	return (
		<div className="flex w-full gap-4">
			<ExposureSlider
				label={exposureLabel}
				exposure={exposure}
				field={exposureField}
				value={latestValue}
				dangerLevel={latestDangerLevel}
				unitLabel={exposureUnitLabel}
				className="w-48"
			/>
			<div className="w-128 flex-1 self-stretch">
				<BaseExposureLineChartCard
					minTime={minTime}
					maxTime={maxTime}
					chartData={data}
					unit={chartUnit}
					maxY={maxY}
					minY={minY}
					lineType={lineType}
					exposure={exposure}
					variant="compact"
					className={chartClassName}
					contentClassName="p-0"
					chartContainerClassName="!aspect-auto"
					showLegend={showLegend}
					xAxisMode="windowed"
					dustField={exposureField}
				>
					<ThresholdLine y={threshold.danger} dangerLevel="danger" />
					<ThresholdLine y={threshold.warning} dangerLevel="warning" />
				</BaseExposureLineChartCard>
			</div>
		</div>
	);
};
