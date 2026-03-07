import { InteractiveCard } from "@/components/interactive-card";
import { Badge } from "@/components/ui/badge";

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
}: StatCardProps) => (
	<button type="button" onClick={onClick} className="w-full text-left">
		<InteractiveCard className={className}>
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-xs uppercase tracking-widest dark:text-zinc-400">
					{label}
				</h2>

				<Badge variant="outline" className="rounded-lg">
					{totalValue} {totalText}
				</Badge>
			</div>

			<p className="w-fit font-bold text-3xl leading-tight">{value}</p>

			<p className="text-xs text-zinc-500 dark:text-zinc-400">
				{description}
			</p>
		</InteractiveCard>
	</button>
);
