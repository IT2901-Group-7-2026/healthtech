import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { UsersIcon } from "lucide-react";

interface Props {
	count: number;
	badgeBgClassName: string;
	isLoading?: boolean;
}

export const MapUsersBadge = ({
	count,
	badgeBgClassName,
	isLoading,
}: Props) => (
	<div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-slate-900/90 px-2 py-1 pl-1 font-bold text-[13px] text-white leading-none shadow-md">
		<div
			className={cn(
				"flex h-6 w-6 items-center justify-center rounded-full border-white/20",
				badgeBgClassName,
			)}
		>
			<UsersIcon size={14} strokeWidth={2.5} color="white" />
		</div>

		{isLoading ? (
			<Skeleton className="h-[13px] w-[13px] bg-white/20" />
		) : (
			<p>{count}</p>
		)}
	</div>
);
