import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export type InteractiveCardProps = {
	className?: string;
	viewDetailsText?: string;
};

export const InteractiveCard = ({
	className,
	children,
	viewDetailsText,
}: PropsWithChildren<InteractiveCardProps>) => {
	const { t } = useTranslation();

	return (
		<Card
			className={cn(
				"group flex h-full flex-col justify-between gap-2 border border-white/10 bg-white/5 p-4 transition-colors hover:ring-1",
				"hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/60 hover:ring-zinc-200 active:bg-zinc-50 active:shadow-sm",
				"dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400",
				className,
			)}
		>
			{children}
			<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
				<p>
					{viewDetailsText ?? t(($) => $.interactiveCard.viewDetails)}
				</p>
				<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</div>
		</Card>
	);
};
