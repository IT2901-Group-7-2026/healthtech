import { DailyNotes } from "@/components/daily-notes";
import { ExposureSlider } from "@/components/exposure-slider";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { SecurityRegulationsCard } from "@/features/security-regulations-card/security-regulations-card";
import { useUser } from "@/features/user/user-context";
import { sensorQueryOptions } from "@/lib/api";
import { now, toTZDate } from "@/lib/date";
import type { SensorDataResponseDto } from "@/lib/dto";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQuery } from "@tanstack/react-query";
import { addHours, addMinutes, isWithinInterval, minutesToMilliseconds, startOfDay, startOfMinute } from "date-fns";
import { Clock } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type TimeRangeOption = "30" | "60" | "180";
const parseTimeRange = parseAsStringLiteral(["30", "60", "180"]);

const TIME_RANGE_MINUTES: Record<TimeRangeOption, number> = {
	"30": 30,
	"60": 60,
	"180": 180,
};

export default function OperatorLiveView() {
	const { user } = useUser();
	const [selectedUserId] = useQueryState("userId", parseAsString);
	const { t } = useTranslation();

	const [timeRange, setTimeRange] = useQueryState<TimeRangeOption>("timeRange", parseTimeRange.withDefault("30"));

	const targetUserId = selectedUserId ?? user.id;

	// TODO: Temporarily pushing the current time 3 hours forward for demo purposes.
	const startOfCurrentMinute = startOfMinute(toTZDate(addHours(now(), 3)));
	const end = startOfCurrentMinute;
	const start = addMinutes(startOfCurrentMinute, -TIME_RANGE_MINUTES[timeRange]);

	// We have at most 1 data point every minute so we don't need a shorter refetch interval than that
	const dataRefetchInterval = minutesToMilliseconds(1);

	const { data: dustTwa1Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", end, {
				granularity: "minute",
				aggregationFunction: "avg",
				field: "pm1_twa",
				startTime: start,
				endTime: end,
				// clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: dustTwa25Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", end, {
				granularity: "minute",
				aggregationFunction: "avg",
				field: "pm25_twa",
				startTime: start,
				endTime: end,
				// clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: dustTwa10Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", end, {
				granularity: "minute",
				aggregationFunction: "avg",
				field: "pm10_twa",
				startTime: start,
				endTime: end,
				// clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: noiseData } = useQuery(
		sensorQueryOptions({
			sensor: "noise",
			query: buildSensorQuery("noise", "day", end, {
				granularity: "minute",
				startTime: start,
				endTime: end,
				// clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: rawVibrationData } = useQuery(
		sensorQueryOptions({
			sensor: "vibration",
			query: buildSensorQuery("vibration", "day", end, {
				granularity: "minute",
				startTime: toTZDate(startOfDay(start)),
				endTime: end,
				// clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	// Since vibration is cumulative over the day we have to fetch data from the start of the day and then filter it to the selected time range
	const vibrationData = useMemo(() => {
		if (!rawVibrationData) {
			return [];
		}

		return rawVibrationData.filter((d) => isWithinInterval(d.time, { start, end }));
	}, [rawVibrationData, start, end]);

	return (
		<div
			className="flex w-full flex-col gap-4 md:grid"
			style={{
				gridTemplateColumns: "minmax(calc(var(--spacing) * 40), 1fr) minmax(0, 3fr) calc(var(--spacing) * 73)",
			}}
		>
			<aside className="flex flex-col gap-4 md:col-start-1">
				<SecurityRegulationsCard />
				<DailyNotes />
			</aside>

			<div className="flex min-w-0 flex-col gap-4 md:col-start-2">
				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.dust)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM1 TWA"}
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.dust_y_axis)}
							data={dustTwa1Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM2.5 TWA"}
							exposureField="pm25_twa"
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.dust_y_axis)}
							data={dustTwa25Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM10 TWA"}
							exposureField="pm10_twa"
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.dust_y_axis)}
							data={dustTwa10Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.noise)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="noise"
							exposureLabel={t(($) => $.noise)}
							exposureUnitLabel="dB"
							chartUnitLabel="db (TWA)"
							data={noiseData ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.vibration)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="vibration"
							exposureLabel={t(($) => $.vibration)}
							exposureUnitLabel={t(($) => $.points)}
							chartUnitLabel={t(($) => $.points)}
							data={vibrationData ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>
			</div>

			<aside className="md:col-start-3">
				<Card muted={true} className="flex flex-col gap-4">
					<p className="flex items-center gap-2 text-sm">
						<Clock size="1rem" />
						{t(($) => $.live.timeRange.label)}
					</p>
					<ToggleGroup
						type="single"
						value={timeRange}
						variant="outline"
						onValueChange={(value: TimeRangeOption) => {
							setTimeRange(value);
						}}
					>
						<ToggleGroupItem value="30" aria-label={t(($) => $.live.timeRange.options.thirtyMinutes)}>
							<p>{t(($) => $.live.timeRange.options.thirtyMinutes)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem value="60" aria-label={t(($) => $.live.timeRange.options.oneHour)}>
							<p>{t(($) => $.live.timeRange.options.oneHour)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem value="180" aria-label={t(($) => $.live.timeRange.options.threeHours)}>
							<p>{t(($) => $.live.timeRange.options.threeHours)}</p>
						</ToggleGroupItem>
					</ToggleGroup>
				</Card>
			</aside>
		</div>
	);
}

interface LiveExposureCardProps {
	sensor: "dust" | "noise" | "vibration";
	exposureLabel: string;
	exposureField?: "pm1_twa" | "pm25_twa" | "pm10_twa";
	exposureUnitLabel: string;
	chartUnitLabel: string;
	data: Array<SensorDataResponseDto>;
	minTime: TZDate;
	maxTime: TZDate;
	chartClassName?: string;
}

const LiveExposureCard = ({
	sensor,
	exposureLabel,
	exposureField,
	exposureUnitLabel,
	chartUnitLabel,
	data,
	minTime,
	maxTime,
	chartClassName,
}: LiveExposureCardProps) => {
	const { t } = useTranslation();

	const maxValue = Math.max(...data.map((d) => d.value));

	const minY = 0;
	let maxY = sensor === "vibration" ? 450 : sensor === "noise" ? 150 : 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const threshold = getThreshold(sensor, exposureField);
	const latestData = data.at(-1);
	const latestValue = latestData?.value;
	const latestDangerLevel = latestData?.dangerLevel;

	return (
		<div className="flex w-full gap-4">
			<ExposureSlider
				label={exposureLabel}
				sensor={sensor}
				field={exposureField}
				value={latestValue}
				dangerLevel={latestDangerLevel}
				unitLabel={exposureUnitLabel}
				className="w-48"
			/>
			<div className="w-128 flex-1 self-stretch">
				<ChartLineDefault
					minTime={minTime}
					maxTime={maxTime}
					chartData={data}
					chartTitle=""
					unit={chartUnitLabel}
					maxY={maxY}
					minY={minY}
					lineType="monotone"
					sensor={sensor}
					hideLabels={true}
					disableAnimation={true}
					startTickLabel=""
					endTickLabel={t(($) => $.live.chart.now)}
					className={chartClassName}
					contentClassName="p-0"
					chartContainerClassName="!aspect-auto"
					hideHeader={true}
					muteTickLabels={true}
				>
					<ThresholdLine y={threshold.danger} dangerLevel="danger" hideLineLabel={true} />
					<ThresholdLine y={threshold.warning} dangerLevel="warning" hideLineLabel={true} />
				</ChartLineDefault>
			</div>
		</div>
	);
};
