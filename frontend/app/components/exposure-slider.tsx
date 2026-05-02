import { ExposureIcon } from "@/components/exposure-icon";
import type { Exposure } from "@/features/exposure-picker/exposures";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels";
import type { ExposureTypeField } from "@/lib/dto";
import { getThreshold } from "@/lib/thresholds";
import { cn, getEmoji } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Props {
	exposure: Exposure;
	field?: ExposureTypeField | null;
	value?: number;
	dangerLevel?: DangerLevel;
	unitLabel: string;
	label: string;
	className?: string;
}

export function ExposureSlider({ exposure, field, value, dangerLevel, unitLabel: unit, label, className }: Props) {
	const { i18n } = useTranslation();
	const { danger } = getThreshold(exposure, field);
	const sliderMax = danger * 1.5;
	const percentage =
		value === undefined ? 0 : Math.min(100, Math.max(0, sliderMax <= 0 ? 0 : (value / sliderMax) * 100));

	const valueFormatter = new Intl.NumberFormat(i18n.language === "no" ? "nb-NO" : "en-US", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});
	const formattedValue = valueFormatter.format(value ?? 0);

	const Emoji = getEmoji(dangerLevel ?? null);
	const color = dangerLevel === undefined ? undefined : dangerlevelStyles[dangerLevel].color;

	return (
		<div className={cn("flex w-full flex-col gap-1.5 rounded-xl border border-transparent p-3", className)}>
			<div className="flex items-center gap-1.5 font-semibold text-sm">
				<ExposureIcon type={exposure} size="xs" />
				<span className="flex flex-row items-center gap-3">
					<span>{label}</span>
					<Emoji style={{ color }} size={20} />
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
							// Make sure the indicator stays within the bounds of the slider
							style={{
								left: `clamp(8px, ${percentage}%, calc(100% - 8px))`,
							}}
							aria-hidden="true"
						/>
					)}
				</div>
			</div>

			<p className="font-semibold text-2xl">
				{formattedValue}
				<span className="ml-1 font-medium text-muted-foreground text-sm">{unit}</span>
			</p>
		</div>
	);
}
