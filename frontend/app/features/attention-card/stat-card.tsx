import { Card, CardContent, CardFooter } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { ArrowRightIcon } from "lucide-react";
import { type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export type StatCardProps = PropsWithChildren & {
	className?: string;
	value: number;
	label: string;
	onClick?: () => void;
};

export const StatCard = ({
	className,
	value,
	label,
	onClick,
	children,
}: StatCardProps) => {
	const { t } = useTranslation();

	const isHoverable = onClick !== undefined;

	return (
		<button type="button" onClick={onClick} className="w-full text-left">
			<Card
				hoverable={isHoverable}
				className={cn("group h-full justify-between gap-2", className)}
			>
				<CardContent className="gap-4">
					<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
						{label}
					</h2>

					<p className="w-fit font-bold text-3xl leading-tight">
						{value}
					</p>

					<div className="flex flex-row items-center gap-3">
						{children}
					</div>
				</CardContent>

				{isHoverable && (
					<CardFooter className="mt-2 gap-1 text-muted-foreground text-xs">
						<p>{t(($) => $.interactiveCard.viewDetails)}</p>
						<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
					</CardFooter>
				)}
			</Card>
		</button>
	);
};
