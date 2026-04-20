import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import type * as React from "react";

type ExportButtonProps = Omit<
	React.ComponentProps<typeof Button>,
	"children" | "size" | "variant" | "title" | "aria-label"
> & {
	title: string;
};

export function ExportButton({ title, className, ...props }: ExportButtonProps) {
	return (
		<Button
			size="icon-sm"
			variant="outline"
			className={cn(
				"bg-card-highlight hover:bg-card-highlight-hover hover:text-foreground dark:bg-card-highlight dark:hover:bg-card-highlight-hover dark:hover:text-foreground",
				className,
			)}
			title={title}
			aria-label={title}
			{...props}
		>
			<Download />
		</Button>
	);
}
