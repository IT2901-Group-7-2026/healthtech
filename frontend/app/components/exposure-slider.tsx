import { SensorIcon } from "@/components/sensor-icon";
import type { Sensor } from "@/features/sensor-picker/sensors";
import type { DangerLevel } from "@/lib/danger-levels";
import type { SensorTypeField } from "@/lib/dto";
import { getThreshold } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
	sensor: Sensor;
	field?: SensorTypeField | null;
	value?: number;
	dangerLevel?: DangerLevel;
	unitLabel: string;
	label: string;
}

export function ExposureSlider({ sensor, field, value, dangerLevel, unitLabel: unit, label }: Props) {
	const { i18n } = useTranslation();
	const { danger } = getThreshold(sensor, field);
	const sliderMax = danger * 1.5;
	const percentage =
		value !== undefined ? Math.min(100, Math.max(0, sliderMax <= 0 ? 0 : (value / sliderMax) * 100)) : 0;
	const indicatorLeftOffset = `${percentage}%`;
	const isAlert = dangerLevel === "danger";

	const valueFormatter = new Intl.NumberFormat(i18n.language === "no" ? "nb-NO" : "en-US", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
	const formattedValue = valueFormatter.format(value ?? 0);

	return (
		<div className="flex w-full flex-col gap-1.5 rounded-xl border border-transparent p-3">
			<div className="flex items-center gap-1.5 font-semibold text-sm">
				<SensorIcon type={sensor} size="xs" />
				<span className="flex flex-row items-center gap-3">
					<span>{label}</span>
					{isAlert && <TriangleAlert size={20} className="text-danger" />}
				</span>
			</div>

			<div className="relative flex items-center py-2">
				<div className="relative w-full">
					<div className="h-2.5 w-full rounded-full bg-[linear-gradient(to_right,var(--safe)_0%,var(--safe)_40%,var(--warning)_70%,var(--danger)_100%)]" />
					{value !== undefined && (
						<div
							className={cn(
								"absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-foreground bg-transparent shadow-md",
							)}
							style={{ left: indicatorLeftOffset }}
							aria-hidden="true"
						/>
					)}
				</div>
			</div>

			<p className="font-semibold text-2xl tracking-tight">
				{formattedValue}
				<span className="ml-1 font-medium text-muted-foreground text-sm">{unit}</span>
			</p>
		</div>
	);
}
