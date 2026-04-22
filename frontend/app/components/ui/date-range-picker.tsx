import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useId } from "react";

export type DateRange = {
	from?: TZDate;
	to?: TZDate;
};

export type DateRangePickerProps = {
	value: DateRange;
	onChange: (range: DateRange) => void;
	minDate: TZDate;
	maxDate: TZDate;
	placeholder?: string;
};

export function DateRangePicker({
	value,
	onChange,
	minDate,
	maxDate,
	placeholder = "Velg dato",
}: DateRangePickerProps) {
	const pickerId = useId();

	const tzToPlain = (tz?: TZDate) => (tz ? new Date(tz.getTime()) : undefined);
	const plainToTz = (plain?: Date) => (plain ? new TZDate(plain, "Europe/Oslo") : undefined);

	const displayFrom = tzToPlain(value.from);
	const displayTo = tzToPlain(value.to);

	const handleSelect = useCallback(
		(range: { from?: Date; to?: Date }) => {
			onChange({
				from: plainToTz(range.from),
				to: plainToTz(range.to),
			});
		},
		[onChange],
	);

	return (
		<Popover>
			<PopoverTrigger asChild={true}>
				<Button variant="outline" id={pickerId} className="justify-start px-2.5 font-normal">
					<CalendarIcon className="mr-2 h-[1.2rem] w-[1.2rem]" />
					{displayFrom ? (
						displayTo ? (
							<>
								{format(displayFrom, "LLL dd, y")}
								<span className="mx-1">-</span>
								{format(displayTo, "LLL dd, y")}
							</>
						) : (
							format(displayFrom, "LLL dd, y")
						)
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					required={true}
					selected={{ from: displayFrom, to: displayTo }}
					onSelect={handleSelect}
					defaultMonth={displayFrom ?? new Date()}
					numberOfMonths={2}
					disabled={(date) => {
						const ts = date.getTime();
						return ts < minDate.getTime() || ts > maxDate.getTime();
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
