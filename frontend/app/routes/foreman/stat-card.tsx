import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card.js";
import { cn } from "@/lib/utils.js";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export type StatCardProps = {
	className?: string;
	totalValue: number;
	value: number;
	to: string;
	label: string;
	description: string;
	totalText: string;
	onClick?: () => void;
};

export const StatCard = ({
	className,
	totalValue,
	value,
	label,
	description,
	totalText,
	onClick,
}: StatCardProps) => {
	const { t } = useTranslation();

	return (
		<button type="button" onClick={onClick} className="w-full text-left">
			<Card
				hoverable
				className={cn("group h-full justify-between gap-2", className)}
			>
				<CardContent>
					<div className="flex items-center justify-between gap-2">
						<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
							{label}
						</h2>

						<Badge variant="outline" className="rounded-lg">
							{totalValue} {totalText}
						</Badge>
					</div>

					<p className="w-fit font-bold text-3xl leading-tight">
						{value}
					</p>

					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						{description}
					</p>
				</CardContent>

				<CardFooter className="gap-1 text-muted-foreground text-xs">
					<p>{t(($) => $.interactiveCard.viewDetails)}</p>
					<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
				</CardFooter>
			</Card>
		</button>
	);
};
