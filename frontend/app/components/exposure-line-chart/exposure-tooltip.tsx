import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { toTZDate } from "@/lib/date";
import type { SensorUnit } from "@/lib/sensors";
import { formatSensorValue } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ExposureTooltip({ unit }: { unit: SensorUnit }) {
	const formatDate = useFormatDate();
	const { t } = useTranslation();

	return (
		<ChartTooltip
			cursor={false}
			content={
				<ChartTooltipContent
					labelFormatter={(_label, payload) => {
						const time = payload?.[0]?.payload?.time;

						if (!time) return "";

						return formatDate(toTZDate(time), "HH:mm");
					}}
				/>
			}
			formatter={(value?: number) => [`${formatSensorValue(value, unit)} ${t(($) => $.sensors.units[unit])}`]}
		/>
	);
}
