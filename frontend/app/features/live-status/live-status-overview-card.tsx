import { Card } from "@/components/ui/card";
import type { DangerLevel } from "@/lib/danger-levels";
import { mapDangerLevelToColor } from "@/lib/danger-levels";
import { sensors } from "@/lib/sensors";
import { getEmoji } from "@/lib/utils";
import { t } from "i18next";

interface LiveStatusOverviewCardProps {
	sensorDangerLevels: {
		dust: DangerLevel;
		noise: DangerLevel;
		vibration: DangerLevel;
	};
}

function mapDangerLevelToLabel(dangerLevel: DangerLevel) {
	return t(($) => $.live.overviewCard[dangerLevel]);
}

export const LiveStatusOverviewCard = ({ sensorDangerLevels }: LiveStatusOverviewCardProps) => (
	<Card>
		<div className="grid grid-cols-3 gap-2">
			{sensors.map((sensor) => {
				const dangerLevel = sensorDangerLevels[sensor];
				const Icon = getEmoji(dangerLevel);

				return (
					<div
						key={sensor}
						className="flex flex-row justify-between rounded-md border border-b-card-highlight p-2"
					>
						<div>{t(($) => $.sensors[sensor])}</div>

						<div
							className={`flex flex-row items-center text-xs text-${mapDangerLevelToColor(dangerLevel)} gap-1`}
						>
							<p>{mapDangerLevelToLabel(dangerLevel)}</p>
							<Icon className="h-5 w-5" />
						</div>
					</div>
				);
			})}
		</div>
	</Card>
);
