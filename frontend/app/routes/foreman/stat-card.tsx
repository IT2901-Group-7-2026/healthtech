import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

export type StatCardProps = {
	className?: string;
	totalValue: number;
	value: number;
	to: string;
	label: string;
	description: string;
	viewDetailsText: string;
	totalText: string;
};

export const StatCard = ({
	className,
	totalValue,
	value,
	to,
	label,
	description,
	totalText,
	viewDetailsText,
}: StatCardProps) => (
	<Link
		to={to}
		className={cn(
			"h-full w-full flex-1 basis-64 rounded-2xl md:last:col-span-2 lg:last:col-span-1",
			className,
		)}
	>
		<Card
			className={cn(
				"group flex h-full flex-col justify-between gap-2 border border-white/10 bg-white/5 p-4 transition-colors hover:ring-1",
				"hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/60 hover:ring-zinc-200 active:bg-zinc-50 active:shadow-sm",
				"dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
					{label}
				</h2>

				<Badge variant="outline" className="rounded-lg">
					{totalValue} {totalText}
				</Badge>
			</div>

			<p className="w-fit font-bold text-3xl leading-tight">{value}</p>

			<p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
			<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
				<p>{viewDetailsText}</p>
				<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</div>
		</Card>
	</Link>
);
