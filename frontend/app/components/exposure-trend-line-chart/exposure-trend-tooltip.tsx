import type { ExposureUnit } from "@/lib/exposures.ts";
import { formatExposureValue } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import { ChartTooltip } from "../ui/chart.tsx";
import type { SeriesDefinition } from "./trend-line-chart.tsx";

export function ExposureTrendTooltip({
	unit,
	seriesDefinitions,
}: {
	unit: ExposureUnit;
	seriesDefinitions: Array<SeriesDefinition>;
}) {
	const { t } = useTranslation();

	return (
		<ChartTooltip
			cursor={false}
			payloadUniqBy={true}
			content={({ active, payload, label }) => {
				if (!(active && payload?.length)) {
					return null;
				}

				return (
					<div className="rounded-md border bg-background p-3 shadow">
						<div className="mb-2 font-medium">{label}</div>

						<div className="space-y-1">
							{payload.map((entry) => {
								const series = seriesDefinitions.find(
									(seriesDefinition) => seriesDefinition.dataKey === entry.dataKey,
								);

								return (
									<div
										key={String(entry.dataKey)}
										className="flex items-center justify-between gap-4"
									>
										<div className="flex items-center gap-2">
											{seriesDefinitions.length > 1 && (
												<div
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: entry.color }}
												/>
											)}
											<span>{series?.label ?? entry.name}</span>
										</div>

										<span>
											{formatExposureValue(entry.value, unit)} {t(($) => $.exposures.units[unit])}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				);
			}}
		/>
	);
}
