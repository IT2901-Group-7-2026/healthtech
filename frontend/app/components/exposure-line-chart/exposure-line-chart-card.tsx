"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { ExposureLineChart, type ExposureLineChartProps } from "./exposure-line-chart";

export function ExposureLineChartCard({
	chartTitle,
	headerRight,
	hideHeader,
	contentClassName,
	className,
	...props
}: ExposureLineChartProps & {
	chartTitle: string;
	headerRight?: React.ReactNode;
	hideHeader?: boolean;
	contentClassName?: string;
	className?: string;
}) {
	return (
		<Card className={cn("w-full", props.variant === "compact" && "pl-0", className)}>
			{!hideHeader && (
				<CardHeader className="mb-4 flex flex-row items-center justify-between">
					<CardTitle>{chartTitle}</CardTitle>
					{headerRight}
				</CardHeader>
			)}
			<CardContent className={cn("flex h-full flex-1", contentClassName)}>
				<ExposureLineChart {...props} />
			</CardContent>
		</Card>
	);
}

export function ExposureLineChartCardSkeleton() {
	return (
		<Card className="flex aspect-video w-full flex-col items-center gap-5">
			<div className="flex w-full flex-row justify-between">
				<Skeleton className="h-8 w-50" /> <Skeleton className="h-8 w-30" />
			</div>

			<Skeleton className="size-full"></Skeleton>
		</Card>
	);
}
