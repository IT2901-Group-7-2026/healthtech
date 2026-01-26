import { Card } from "@/components/ui/card";
import { WeeklyPopup } from "@/features/popups/weekly-popup";
import { DialogDescription } from "@radix-ui/react-dialog";
import { type Day, isSameWeek, type Locale } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePopup } from "../popups/use-popup";
import { WeekDaysHeader } from "./components/week-days-header";
import { WeekEventGrid } from "./components/week-event-grid";
import { WeekGrid } from "./components/week-grid";
import { WeekHeader } from "./components/week-header";
import type { Cell, WeekEvent } from "./types";
import { useWeekView } from "./use-week-view";

export function WeekWidget({
	minuteStep = 30,
	weekStartsOn = 1,
	dayStartHour = 8,
	dayEndHour = 16,
	locale,
	rowHeight = 56,
	disabledCell,
	disabledDay,
	disabledWeek,
	events,
}: {
	minuteStep?: number;
	weekStartsOn?: Day;
	dayStartHour?: number;
	dayEndHour?: number;
	locale?: Locale;
	rowHeight?: number;
	disabledCell?: (date: Date) => boolean;
	disabledDay?: (date: Date) => boolean;
	disabledWeek?: (startDayOfWeek: Date) => boolean;
	events?: Array<WeekEvent>;
	onCellClick?: (cell: Cell) => void;
}) {
	const { days, nextWeek, previousWeek, goToToday, viewTitle } = useWeekView({
		minuteStep,
		weekStartsOn,
		dayStartHour,
		dayEndHour,
		locale,
		disabledCell,
		disabledDay,
		disabledWeek,
	});

	const { t, i18n } = useTranslation();
	const { visible, closePopup, openPopup } = usePopup();

	const [popupData, setPopupData] = useState<{
		event: WeekEvent | null;
	}>({ event: null });

	function handleEventClick(event: WeekEvent): void {
		setPopupData({ event: event });
		openPopup();
	}

	const eventTitle = (event: WeekEvent) => {
		const actualDay = event.startDate.toLocaleDateString(i18n.language, {
			day: "numeric",
			month: "long",
		});
		const timeConfig: Intl.DateTimeFormatOptions = {
			hour: "2-digit",
			minute: "2-digit",
		};
		const start = event.startDate.toLocaleTimeString(i18n.language, timeConfig);
		const end = event.endDate.toLocaleTimeString(i18n.language, timeConfig);
		const translatedTitle = t(($) => $.popup.eventTitle, {
			day: actualDay,
			start: start,
			end: end,
		});
		return translatedTitle;
	};

	return (
		<>
			<Card className="w-full">
				<div className="flex flex-col overflow-hidden px-1">
					<WeekHeader
						title={viewTitle}
						onNext={nextWeek}
						onPrev={previousWeek}
						onToday={goToToday}
						showTodayButton={
							!isSameWeek(days[0].date, new Date(), {
								weekStartsOn: weekStartsOn,
							})
						}
					/>
					<div className="flex flex-1 select-none flex-col overflow-hidden">
						<div className="isolate flex flex-1 flex-col overflow-auto">
							<div className="flex min-w-[500px] flex-none flex-col">
								<WeekDaysHeader days={days} />
								<div className="grid grid-cols-1 grid-rows-1">
									<div className="col-start-1 row-start-1">
										<WeekGrid days={days} rowHeight={rowHeight} />
									</div>
									<div className="col-start-1 row-start-1">
										<WeekEventGrid
											days={days}
											events={events}
											handleEventClick={handleEventClick}
											weekStartsOn={weekStartsOn}
											minuteStep={minuteStep}
											rowHeight={rowHeight}
											dayStartHour={dayStartHour}
											dayEndHour={dayEndHour}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			{/* interaction popup window */}
			{popupData.event && (
				<WeeklyPopup
					title={eventTitle(popupData.event)}
					event={popupData.event}
					open={visible}
					onClose={closePopup}
				>
					<DialogDescription className="font-medium text-xl">
						{t(($) => $.popup.exposureTitle)}
					</DialogDescription>
				</WeeklyPopup>
			)}
		</>
	);
}
