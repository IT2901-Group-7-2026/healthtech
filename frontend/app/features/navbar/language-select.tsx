import { Languages } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select.js";
import type { i18nInstance, TranslateFn } from "@/i18n/config.js";
import { cn } from "@/lib/utils.js";

export const LanguageSelect = ({
	i18n,
	t,
}: {
	i18n: typeof i18nInstance;
	t: TranslateFn;
}) => (
	<Select
		value={i18n.language || "en"}
		onValueChange={(value) => {
			i18n.changeLanguage(value);
			localStorage.setItem("i18nextLng", value);
		}}
	>
		<SelectTrigger
			withoutChevron
			className={cn(
				"h-9 w-9 border-none bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0",
				"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
			)}
		>
			<Languages className="mx-auto size-[1.2rem] text-foreground" />
		</SelectTrigger>
		<SelectContent className="w-32">
			<SelectItem key={"en"} value={"en"}>
				{t(($) => $.english)}
			</SelectItem>
			<SelectItem key={"no"} value={"no"}>
				{t(($) => $.norwegian)}
			</SelectItem>
		</SelectContent>
	</Select>
);
