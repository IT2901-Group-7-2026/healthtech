import { ExposureSlider } from "@/components/exposure-slider";
import { LiveStatusOverviewCard } from "@/features/live-status/live-status-overview-card";
import { SecurityRegulationsCard } from "@/features/security-regulations-card/security-regulations-card";
import { useUser } from "@/features/user/user-context";
import { sensorQueryOptions } from "@/lib/api";
import { now, parseAsTZDate, today } from "@/lib/date";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import { useQuery } from "@tanstack/react-query";
import { addMinutes, minutesToMilliseconds, startOfMinute } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

export default function OperatorLiveView() {
	const { t } = useTranslation();
	const { user } = useUser();
	const [selectedUserId] = useQueryState("userId", parseAsString);

	const [date] = useQueryState("filterDate", parseAsTZDate.withDefault(today()));

	const selectedDate = date;
	const targetUserId = selectedUserId ?? user.id;

	const startOfCurrentMinute = startOfMinute(now());
	const start = addMinutes(startOfCurrentMinute, -30);

	// We have at most 1 data point every minute so we don't need a shorter refetch interval than that
	const dataRefetchInterval = minutesToMilliseconds(1);

	const { data: dustTwa1Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "hour",
				aggregationFunction: "avg",
				field: "pm1_twa",
				startTime: start,
				clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: dustTwa25Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "hour",
				aggregationFunction: "avg",
				field: "pm25_twa",
				startTime: start,
				clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: dustTwa10Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "hour",
				aggregationFunction: "avg",
				field: "pm10_twa",
				startTime: start,
				clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: noiseData } = useQuery(
		sensorQueryOptions({
			sensor: "noise",
			query: buildSensorQuery("noise", "day", selectedDate, {
				granularity: "hour",
				aggregationFunction: "avg",
				startTime: start,
				clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	const { data: vibrationData } = useQuery(
		sensorQueryOptions({
			sensor: "vibration",
			query: buildSensorQuery("vibration", "day", selectedDate, {
				granularity: "hour",
				aggregationFunction: "sum",
				startTime: start,
				clampEndTimeToNow: true,
			}),
			userId: targetUserId,
			refetchInterval: dataRefetchInterval,
		}),
	);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex w-1/5 shrink-0 flex-col gap-4">
				<SecurityRegulationsCard />
			</div>

			<div className="flex w-full min-w-0 flex-col gap-4">
				<LiveStatusOverviewCard
					sensorDangerLevels={{
						dust: "safe",
						noise: "danger",
						vibration: "warning",
					}}
				/>

				<div className="flex w-full min-w-0 flex-nowrap gap-4 overflow-x-auto pb-1">
					<ExposureSlider
						label="PM1 TWA"
						sensor="dust"
						field="pm1_twa"
						value={dustTwa1Data?.[0]?.value}
						dangerLevel={dustTwa1Data?.[0]?.dangerLevel}
						unitLabel="µg/m³"
					/>
					<ExposureSlider
						label="PM2.5 TWA"
						sensor="dust"
						field="pm25_twa"
						value={dustTwa25Data?.[0]?.value}
						dangerLevel={dustTwa25Data?.[0]?.dangerLevel}
						unitLabel="µg/m³"
					/>
					<ExposureSlider
						label="PM10 TWA"
						sensor="dust"
						field="pm10_twa"
						value={dustTwa10Data?.[0]?.value}
						dangerLevel={dustTwa10Data?.[0]?.dangerLevel}
						unitLabel="µg/m³"
					/>
					<ExposureSlider
						label={t(($) => $.noise)}
						sensor="noise"
						value={noiseData?.[0]?.value}
						dangerLevel={noiseData?.[0]?.dangerLevel}
						unitLabel="dB"
					/>
					<ExposureSlider
						label={t(($) => $.vibration)}
						sensor="vibration"
						value={vibrationData?.[0]?.value}
						dangerLevel={vibrationData?.[0]?.dangerLevel}
						unitLabel="m/s²"
					/>
				</div>
			</div>
		</div>
	);
}
