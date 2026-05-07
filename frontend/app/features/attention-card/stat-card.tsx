import { DangerLevelDots } from "@/components/danger-level-dots.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels.ts";
import { cn } from "@/lib/utils.ts";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export type StatCardProps = {
	className?: string;
	value: number;
	label: string;
	dangerLevel: DangerLevel;
	onClick?: () => void;
};

export const StatCard = ({ className, value, label, dangerLevel, onClick }: StatCardProps) => {
	const { t } = useTranslation();

	const isHoverable = onClick !== undefined;
	const visualDangerLevel = value === 0 ? "none" : dangerLevel;
	const { bgSubtle, border, text } = dangerlevelStyles[visualDangerLevel];

	return (
		<button type="button" onClick={onClick} className="w-full text-left">
			<Card
				className={cn(
					"group h-full justify-between gap-4",
					bgSubtle,
					border,
					text,
					isHoverable && "cursor-pointer transition-all hover:brightness-95 dark:hover:brightness-85",
					className,
				)}
			>
				<CardHeader className="flex justify-between gap-3 p-0">
					<h3 className={cn("font-medium text-sm", text)}>{label}</h3>
					<div className="flex size-2.5 items-center pt-2.5">
						<DangerLevelDots dangerLevel={dangerLevel} horizontal={true} size="sm" />
					</div>
				</CardHeader>
				<CardContent className="flex flex-row justify-between gap-2">
					<p className={cn("font-medium text-4xl tabular-nums leading-none", text)}>{value}</p>

					{isHoverable && (
						<div className="mt-auto flex gap-1 text-xs">
							<p>{t(($) => $.interactiveCard.viewDetails)}</p>
							<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
						</div>
					)}
				</CardContent>
			</Card>
		</button>
	);
};
