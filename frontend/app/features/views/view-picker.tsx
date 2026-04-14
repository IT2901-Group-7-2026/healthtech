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
	allowedViews?: Array<View>;
}

export function ViewPicker({ className, withNavigationButtons = false, allowedViews }: ViewPickerProps) {
	const { view, setView } = useView();
	const { date, navigate, setDate } = useDate();
	const { t } = useTranslation();
	const views = allowedViews ?? ["day", "week", "month"];

	const isTodayDate = isToday(date, { in: TIMEZONE });

	const previousString = t(($) => $.viewPicker.previous);
	const todayString = t(($) => $.viewPicker.today);
	const nextString = t(($) => $.viewPicker.next);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex justify-center">
				<ToggleGroup
					type="single"
					value={view}
					variant="outline"
					className={cn("inline-grid w-fit auto-cols-fr grid-flow-col", className)}
					onValueChange={(value: View) => {
						// Value is an empty string when clicking the already selected item, so we need this check to avoid
						// deselecting.
						if (value) {
							setView(value);
						}
					}}
				>
					{views.includes("day") && (
						<ToggleGroupItem value="day" aria-label={t(($) => $.views.day)}>
							<div className="flex items-center gap-2">
								<DayViewIcon className="size-4" />
								<p className="text-sm">{t(($) => $.views.day)}</p>
							</div>
						</ToggleGroupItem>
					)}

					{views.includes("week") && (
						<ToggleGroupItem value="week" aria-label={t(($) => $.views.week)}>
							<div className="flex items-center gap-2">
								<WeekViewIcon className="size-4" />
								<p className="text-sm">{t(($) => $.views.week)}</p>
							</div>
						</ToggleGroupItem>
					)}

					{views.includes("month") && (
						<ToggleGroupItem value="month" aria-label={t(($) => $.views.month)}>
							<div className="flex items-center gap-2">
								<MonthViewIcon className="size-4" />
								<p className="text-sm">{t(($) => $.views.month)}</p>
							</div>
						</ToggleGroupItem>
					)}
				</ToggleGroup>
			</div>

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
