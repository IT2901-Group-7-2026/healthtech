import { Card } from "@/components/ui/card";
import type { DangerLevel } from "@/lib/danger-levels";
import {
	mapDangerLevelToColor,
	mapDangerLevelToLabel,
} from "@/lib/danger-levels";
import { sensors } from "@/lib/sensors";
import { t } from "i18next";
import { CircleDashedIcon, FrownIcon, MehIcon, SmileIcon } from "lucide-react";

interface LiveStatusOverviewCardProps {
	thresholdValues: {
		dust: DangerLevel;
		noise: DangerLevel;
		vibration: DangerLevel;
	};
}

function getEmoji(dangerLevel: DangerLevel | null) {
	if (dangerLevel === "danger") {
		return FrownIcon;
	}

	if (dangerLevel === "warning") {
		return MehIcon;
	}

	if (dangerLevel === "safe") {
		return SmileIcon;
	}

	return CircleDashedIcon;
}

export const LiveStatusOverviewCard = ({
	thresholdValues,
}: LiveStatusOverviewCardProps) => (
	<Card>
		<div className="grid grid-cols-3 gap-4">
			{sensors.map((sensor) => {
				const dangerLevel = thresholdValues[sensor];
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
