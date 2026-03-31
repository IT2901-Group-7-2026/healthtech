import { Card } from "@/components/ui/card";
import type { DangerLevel } from "@/lib/danger-levels";
import {
	mapDangerLevelToColor,
	mapDangerLevelToLabel,
} from "@/lib/danger-levels";
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

export const LiveStatusOverviewCard = ({
	sensorDangerLevels,
}: LiveStatusOverviewCardProps) => (
	<Card>
		<div className="grid grid-cols-3 gap-4">
			{sensors.map((sensor) => {
				const dangerLevel = sensorDangerLevels[sensor];
				const Icon = getEmoji(dangerLevel);

				return (
					<div
						key={sensor}
						className="flex flex-row justify-between rounded-md border border-accent p-4"
					>
						<div>{t(($) => $[sensor])}</div>

						<div
							className={`flex flex-row gap-2 text-${mapDangerLevelToColor(dangerLevel)}`}
						>
							<p>{mapDangerLevelToLabel(dangerLevel)}</p>
							<Icon />
						</div>
					</div>
				);
			})}
		</div>
	</Card>
);
