"use client";

import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import {
	ExposureLineChart,
	type ExposureLineChartProps,
} from "../../components/exposure-line-chart/exposure-line-chart.tsx";
import { Skeleton } from "../../components/ui/skeleton.tsx";

export function BaseExposureLineChartCard({
	headerRight,
	contentClassName,
	className,
	id,
	...props
}: ExposureLineChartProps & {
	headerRight?: React.ReactNode;
	contentClassName?: string;
	className?: string;
	id?: string;
}) {
	const { t } = useTranslation();
	return (
		<Card className={cn("relative w-full", props.variant === "compact" && "pl-0", className)} id={id}>
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
