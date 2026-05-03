import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { toTZDate } from "@/lib/date";
import type { ExposureUnit } from "@/lib/exposures";
import { formatExposureValue } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ExposureTooltip({ unit }: { unit: ExposureUnit }) {
	const formatDate = useFormatDate();
	const { t } = useTranslation();

	return (
		<ChartTooltip
			cursor={false}
			payloadUniqBy={true}
			content={
				<ChartTooltipContent
					labelFormatter={(_label, payload) => {
						const time = payload?.[0]?.payload?.time;

						if (!time) return "";

						return formatDate(toTZDate(time), "HH:mm");
					}}
				/>
			}
			formatter={(value?: number) => [`${formatExposureValue(value, unit)} ${t(($) => $.exposures.units[unit])}`]}
		/>
	);
}
