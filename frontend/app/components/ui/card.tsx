import type * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
	muted?: boolean;
	hoverable?: boolean;
};

function Card({ className, muted, hoverable, ...props }: CardProps) {
	return (
		<div
			data-slot="card"
			className={cn(
				"flex flex-col gap-2 p-4 rounded-xl",
				"bg-card text-card-foreground",
				"border border-zinc-200 dark:border-transparent",
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
			className={cn("flex flex-col gap-3", className)}
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
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
};
