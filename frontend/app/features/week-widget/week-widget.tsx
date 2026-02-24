import { Card } from "@/components/ui/card";
import { WeeklyPopup } from "@/features/popups/weekly-popup";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { DialogDescription } from "@radix-ui/react-dialog";
import type { NoiseViewMode } from "app/routes/operator/sensors/noise";
import type { Day, Locale } from "date-fns";
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
	isDisabledCell,
	isDisabledDay,
	isDisabledWeek,
	events,
	viewMode,
}: {
	minuteStep?: number;
	weekStartsOn?: Day;
	dayStartHour?: number;
	dayEndHour?: number;
	locale?: Locale;
	rowHeight?: number;
	isDisabledCell?: (date: Date) => boolean;
	isDisabledDay?: (date: Date) => boolean;
	isDisabledWeek?: (startDayOfWeek: Date) => boolean;
	events?: Array<WeekEvent>;
	onCellClick?: (cell: Cell) => void;
	viewMode?: NoiseViewMode;
}) {
	const { timeSlotSegments, selectNextWeek, selectPreviousWeek, viewTitle } =
		useWeekView({
			minuteStep,
			weekStartsOn,
			dayStartHour,
			dayEndHour,
			locale,
			isDisabledCell,
			isDisabledDay,
			isDisabledWeek,
		});

	const { t } = useTranslation();
	const { visible, closePopup, openPopup } = usePopup();

	const [popupData, setPopupData] = useState<{
		event: WeekEvent | null;
	}>({ event: null });

	const formatDate = useFormatDate();

	function handleEventClick(event: WeekEvent): void {
		setPopupData({ event: event });
		openPopup();
	}

	const eventTitle = (event: WeekEvent) => {
		const actualDay = formatDate(event.startDate, "d MMMM");
		const start = formatDate(event.startDate, "p");
		const end = formatDate(event.endDate, "p");

		return t(($) => $.popup.eventTitle, {
			day: actualDay,
			start: start,
			end: end,
		});
	};

	return (
		<>
			<Card className="w-full">
				<div className="flex flex-col overflow-hidden px-1">
					<WeekHeader
						title={viewTitle}
						onNext={selectNextWeek}
						onPrev={selectPreviousWeek}
					/>
					<div className="flex flex-1 select-none flex-col overflow-hidden">
						<div className="isolate flex flex-1 flex-col overflow-auto">
							<div className="flex min-w-[500px] flex-none flex-col">
								<WeekDaysHeader days={timeSlotSegments} />
								<div className="grid grid-cols-1 grid-rows-1">
									<div className="col-start-1 row-start-1">
										<WeekGrid
											days={timeSlotSegments}
											rowHeight={rowHeight}
										/>
									</div>
									<div className="col-start-1 row-start-1">
										<WeekEventGrid
											days={timeSlotSegments}
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
					viewMode={viewMode}
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
