import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";

interface ActionCardProps {
	dangerLevel: DangerLevel;
	className?: string;
}

export const ActionCard = ({ dangerLevel, className }: ActionCardProps) => {
	const { t } = useTranslation();

	return (
		<Card className={cn(className)}>
			<p
				// text-safe text-warning text-danger
				className={`text-center text-${mapDangerLevelToColor(dangerLevel)} caption-bottom font-bold text-2xl`}
			>
				{t(($) => $.foremanDashboard.actionCard[dangerLevel])}
			</p>
		</Card>
	);
};
