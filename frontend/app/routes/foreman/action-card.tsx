import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ActionCardProps {
	dangerLevel: DangerLevel;
	isLoading?: boolean;
	className?: string;
}

export const ActionCard = ({
	dangerLevel,
	isLoading,
	className,
}: ActionCardProps) => {
	const { t } = useTranslation();

	return (
		<Card className={cn(className)}>
			{isLoading ? (
				<Skeleton className="mx-auto h-8 w-[50%] rounded-md bg-zinc-100 dark:bg-accent" />
			) : (
				<p
					className={`text-center text-${mapDangerLevelToColor(dangerLevel)} caption-bottom font-bold text-2xl`}
				>
					{t(($) => $.foremanDashboard.actionCard[dangerLevel])}
				</p>
			)}
		</Card>
	);
};
