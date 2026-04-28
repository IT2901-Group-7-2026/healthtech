import type * as React from "react";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CardVariant = "default" | "labeled";

type CardProps = React.ComponentProps<"div"> & {
	muted?: boolean;
	hoverable?: boolean;
	variant?: CardVariant;
};

function Card({
	className,
	muted,
	hoverable,
	variant = "default",
	...props
}: CardProps) {
	return (
		<div
			data-slot="card"
			data-variant={variant}
			className={cn(
				"group/card flex flex-col rounded-xl",
				"bg-card text-card-foreground",
				"border border-zinc-200 dark:border-card",
				variant === "default" && "gap-2 p-4",
				variant === "labeled" && "gap-0 overflow-hidden p-0",
				muted && "bg-card/50 text-muted-foreground not-dark:border-zinc-200/66",
				hoverable && [
					"transition-colors hover:ring-1",
					"hover:border-zinc-200 hover:ring-zinc-200 active:bg-zinc-50",
					"dark:hover:border-zinc-700 dark:hover:ring-zinc-700 dark:active:bg-white/15 dark:hover:bg-white/5",
				],
				className,
			)}
			{...props}
		/>
	);
}

type CardLabelHeaderProps = React.ComponentProps<"div"> & React.PropsWithChildren<{
	icon?: LucideIcon;
}>;

function CardLabelHeader({
	className,
	icon: Icon,
	children,
	...props
}: CardLabelHeaderProps) {
	return (
		<div
			data-slot="card-label-header"
			className={cn(
				"flex items-center gap-2 rounded-t-xl bg-secondary px-3 py-2",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("leading-none font-semibold", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn(
				"flex flex-col gap-3",
				"group-data-[variant=labeled]/card:rounded-t-none group-data-[variant=labeled]/card:p-3 group-data-[variant=labeled]/card:py-2",
				className,
			)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center [.border-t]:pt-4", className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardHeader,
	CardLabelHeader,
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
};
