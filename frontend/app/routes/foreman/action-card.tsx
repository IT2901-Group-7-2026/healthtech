import { Card } from "@/components/ui/card";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ActionCardProps {
	dangerLevel: DangerLevel;
	className?: string;
}

export const ActionCard = ({ dangerLevel, className }: ActionCardProps) => {
	const { t } = useTranslation();

	return (
		<Card
			className={cn(
				"group flex flex-col justify-between gap-2 border border-white/10 bg-white/5 p-4 transition-colors hover:ring-1",
				"hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/60 hover:ring-zinc-200 active:bg-zinc-50 active:shadow-sm",
				"dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400",
				className,
			)}
		>
			<div
				className={`text-center text-${mapDangerLevelToColor(dangerLevel)} caption-bottom font-bold text-2xl`}
			>
				{t(($) => $.foremanDashboard.actionCard[dangerLevel])}
			</div>
		</Card>
	);
};
