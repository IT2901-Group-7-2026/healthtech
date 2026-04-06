import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { useTranslation } from "react-i18next";
import { useView } from "./use-view";
import type { View } from "./utils";
import { DayViewIcon, MonthViewIcon, WeekViewIcon } from "./views";

interface ViewPickerProps {
	className?: string;
}

export function ViewPicker({ className }: ViewPickerProps) {
	const { view, setView } = useView();
	const { t } = useTranslation();

	return (
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
	);
}
