import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import { useView } from "./use-view";
import type { View } from "./utils";
import { DayViewIcon, MonthViewIcon, WeekViewIcon } from "./views";

interface ViewPickerProps {
	withNavigationButtons?: boolean;
	className?: string;
}

export function ViewPicker({ className, withNavigationButtons = false }: ViewPickerProps) {
	const { view, setView } = useView();
	const { navigate } = useDate();
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2">
			<ToggleGroup
				type="single"
				value={view}
				variant="outline"
				className={className}
				onValueChange={(value: View) => {
					// Value is an empty string when clicking the already selected item, so we need this check to avoid
					// deselecting.
					if (value) {
						setView(value);
					}
				}}
			>
				<ToggleGroupItem value="day" aria-label={t(($) => $.day)}>
					<div className="flex items-center gap-2">
						<DayViewIcon className="size-4" />
						<p className="text-sm">{t(($) => $.day)}</p>
					</div>
				</ToggleGroupItem>
				<ToggleGroupItem value="week" aria-label={t(($) => $.week)}>
					<div className="flex items-center gap-2">
						<WeekViewIcon className="size-4" />
						<p className="text-sm">{t(($) => $.week)}</p>
					</div>
				</ToggleGroupItem>
				<ToggleGroupItem value="month" aria-label={t(($) => $.month)}>
					<div className="flex items-center gap-2">
						<MonthViewIcon className="size-4" />
						<p className="text-sm">{t(($) => $.month)}</p>
					</div>
				</ToggleGroupItem>
			</ToggleGroup>

			{withNavigationButtons && (
				<div className="grid grid-cols-2 items-center gap-2">
					<Button variant="outline" onClick={() => navigate.previous()} className="flex items-center gap-2">
						<ChevronLeftIcon className="size-4 shrink-0 justify-self-start" />
						<p className="text-sm">{t(($) => $.viewPicker[view].previous)}</p>
					</Button>
					<Button variant="outline" onClick={() => navigate.next()} className="flex items-center gap-2">
						<p className="text-sm">{t(($) => $.viewPicker[view].next)}</p>
						<ChevronRightIcon className="size-4 shrink-0 justify-self-end" />
					</Button>
				</div>
			)}
		</div>
	);
}
