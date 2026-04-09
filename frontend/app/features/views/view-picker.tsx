import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TIMEZONE } from "@/i18n/locale";
import { today } from "@/lib/date";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
	const { date, navigate, setDate } = useDate();
	const { t } = useTranslation();

	const isTodayDate = isToday(date, { in: TIMEZONE });

	const previousString = t(($) => $.viewPicker.previous);
	const todayString = t(($) => $.viewPicker.today);
	const nextString = t(($) => $.viewPicker.next);

	return (
		<div className="flex flex-col gap-2">
			<ToggleGroup
				type="single"
				value={view}
				variant="outline"
				className={cn("grid grid-cols-3", className)}
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
				<div className="grid grid-cols-3 items-center gap-2">
					<Button
						title={previousString}
						size="xs"
						variant="ghost"
						className="px-1!"
						onClick={() => navigate.previous()}
					>
						<ChevronLeftIcon className="size-3.5 shrink-0" />
						<p className="truncate text-xs">{previousString}</p>
					</Button>

					<Button
						title={todayString}
						size="xs"
						variant="ghost"
						className="px-1!"
						onClick={() => setDate(today())}
						disabled={isTodayDate}
					>
						<CalendarIcon className="size-3.5 shrink-0" />
						<p className="truncate text-xs">{todayString}</p>
					</Button>

					<Button
						title={nextString}
						size="xs"
						variant="ghost"
						className="px-1!"
						onClick={() => navigate.next()}
					>
						<p className="truncate text-xs">{nextString}</p>
						<ChevronRightIcon className="size-3.5 shrink-0" />
					</Button>
				</div>
			)}
		</div>
	);
}
