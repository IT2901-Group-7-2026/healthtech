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

export const LiveStatusOverviewCard = ({
	sensorDangerLevels,
}: LiveStatusOverviewCardProps) => (
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
						<div>{t(($) => $[sensor])}</div>

						<div
							className={`text-xs flex items-center flex-row text-${mapDangerLevelToColor(dangerLevel)} gap-1`}
						>
							<p>{mapDangerLevelToLabel(dangerLevel)}</p>
							<Icon className="w-5 h-5" />
						</div>
					</div>
				);
			})}
		</div>
	</Card>
);
