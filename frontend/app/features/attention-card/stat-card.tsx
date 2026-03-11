import { Card, CardContent, CardFooter } from "@/components/ui/card.js";
import { cn } from "@/lib/utils.js";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export type StatCardProps = {
	className?: string;
	value: number;
	to: string;
	label: string;
	description: string;
	onClick?: () => void;
};

export const StatCard = ({
	className,
	value,
	label,
	description,
	onClick,
}: StatCardProps) => {
	const { t } = useTranslation();

	const isHoverable = onClick !== undefined;

	return (
		<button type="button" onClick={onClick} className="w-full text-left">
			<Card
				hoverable={isHoverable}
				className={cn("group h-full justify-between gap-2", className)}
			>
				<CardContent>
					<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
						{label}
					</h2>

					<p className="w-fit font-bold text-3xl leading-tight">
						{value}
					</p>

					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						{description}
					</p>
				</CardContent>

				{isHoverable && (
					<CardFooter className="gap-1 text-muted-foreground text-xs">
						<p>{t(($) => $.interactiveCard.viewDetails)}</p>
						<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
					</CardFooter>
				)}
			</Card>
		</button>
	);
};
