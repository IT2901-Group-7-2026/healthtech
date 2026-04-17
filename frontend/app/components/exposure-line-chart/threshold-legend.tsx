import type { DangerLevel } from "@/lib/danger-levels";
import { useTranslation } from "react-i18next";

export type ThresholdLegendItem = {
	dangerLevel: DangerLevel;
	color: string;
};

const getThresholdStrokeDasharray = (dangerLevel: DangerLevel) => (dangerLevel === "danger" ? "8 4" : "4 4");

export function ThresholdLegend({ items }: { items: Array<ThresholdLegendItem> }) {
	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-6 text-muted-foreground text-xs">
			{items.map((item) => {
				const strokeDasharray = getThresholdStrokeDasharray(item.dangerLevel);

				const dangerLevelLabel = t(($) => $.lineChart[item.dangerLevel]);

				return (
					<div key={item.dangerLevel} className="flex items-center gap-2">
						<svg width="24" height="8" className="shrink-0" aria-label={dangerLevelLabel}>
							<title>{dangerLevelLabel}</title>
							<line
								x1="0"
								y1="4"
								x2="24"
								y2="4"
								stroke={item.color}
								strokeWidth="2"
								strokeDasharray={strokeDasharray}
							/>
						</svg>
						<span>{dangerLevelLabel}</span>
					</div>
				);
			})}
		</div>
	);
}
