"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { ExposureLineChart, type ExposureLineChartProps } from "./exposure-line-chart";

export function ExposureLineChartCard({
	headerRight,
	contentClassName,
	className,
	...props
}: ExposureLineChartProps & {
	headerRight?: React.ReactNode;
	contentClassName?: string;
	className?: string;
}) {
	return (
		<Card className={cn("relative w-full", props.variant === "compact" && "pl-0", className)}>
			{headerRight && <div className="absolute top-2 right-2 z-10 flex items-center gap-2">{headerRight}</div>}
			<CardContent className={cn("flex h-full flex-1", contentClassName)}>
				<ExposureLineChart {...props} />
			</CardContent>
		</Card>
	);
}

export function ExposureLineChartCardSkeleton() {
	return (
		<Card className="flex aspect-video w-full flex-col items-center gap-5">
			<Skeleton className="size-full" />
		</Card>
	);
}
