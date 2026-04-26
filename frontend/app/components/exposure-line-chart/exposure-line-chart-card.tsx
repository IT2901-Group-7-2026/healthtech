"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
	return (
		<Card className={cn("relative w-full", props.variant === "compact" && "pl-0", className)}>
			{headerRight && <div className="absolute top-2 right-2 z-10 flex items-center gap-2">{headerRight}</div>}
			<CardContent className={cn("flex h-full flex-1", contentClassName)}>
				<ExposureLineChart {...props} />
				{props.chartData.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
						{t(($) => $.common.noDataLive)}
					</div>
				)}
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
