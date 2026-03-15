import { Card } from "@/components/ui/card";
import { WeeklyPopup } from "@/features/popups/weekly-popup";
import { useFormatDate } from "@/hooks/use-format-date.js";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { DialogDescription } from "@radix-ui/react-dialog";
import { addHours, type Day, type Locale } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePopup } from "../popups/use-popup";
import { WeekDaysHeader } from "./components/week-days-header";
import { WeekEventGrid } from "./components/week-event-grid";
import { WeekGrid } from "./components/week-grid";
import { WeekHeader } from "./components/week-header";
import type { Cell } from "./types";
import { useWeekView } from "./use-week-view";

interface WeekWidgetProps {
	weekStartsOn?: Day;
	dayStartHour?: number;
	dayEndHour?: number;
	locale?: Locale;
	rowHeight?: number;
	isDisabledCell?: (date: Date) => boolean;
	isDisabledDay?: (date: Date) => boolean;
	isDisabledWeek?: (startDayOfWeek: Date) => boolean;
	data: Array<TimeBucketStatus>;
	onCellClick?: (cell: Cell) => void;
	aggregation?: Aggregation;
}

export function WeekWidget({
	weekStartsOn = 1,
	dayStartHour = 8,
	dayEndHour = 16,
	locale,
	rowHeight = 56,
	isDisabledCell,
	isDisabledDay,
	isDisabledWeek,
	data,
	aggregation,
}: WeekWidgetProps) {
	const { timeSlotSegments, selectNextWeek, selectPreviousWeek, viewTitle } =
		useWeekView({
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
		timeBucket: TimeBucketStatus | null;
	}>({ timeBucket: null });

	const formatDate = useFormatDate();

	function handleHourClick(timeBucket: TimeBucketStatus): void {
		setPopupData({ timeBucket });
		openPopup();
	}

	const timeBucketTitle = (timeBucket: TimeBucketStatus) => {
		const actualDay = formatDate(timeBucket.time, "d MMMM");
		const start = formatDate(timeBucket.time, "p");
		const end = formatDate(addHours(timeBucket.time, 1), "p");

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
											data={data}
											handleHourClick={handleHourClick}
											weekStartsOn={weekStartsOn}
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

			{popupData.timeBucket && (
				<WeeklyPopup
					selectedAggregation={aggregation}
					title={timeBucketTitle(popupData.timeBucket)}
					timeBucketStatus={popupData.timeBucket}
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
