import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback } from "react";

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
	
	const handleSelect = useCallback(
		(range: { from?: Date; to?: Date }) => {
			onChange({
				from: range.from as TZDate,
				to: range.to as TZDate,
			});
		},
		[onChange],
	);

	return (
		<Popover>
			<PopoverTrigger asChild={true}>
				<Button variant="outline" className="justify-center px-2.5 font-normal max-w-[300px]">
					<CalendarIcon className="mr-2 h-[1.2rem] w-[1.2rem]" />
					{value.from ? (
						value.to ? (
							<>
								{format(value.from, "LLL dd, y")}
								<span className="mx-1">-</span>
								{format(value.to, "LLL dd, y")}
							</>
						) : (
							format(value.from, "LLL dd, y")
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
					selected={{ from: value.from, to: value.to }}
					onSelect={handleSelect}
					defaultMonth={value.from ?? new TZDate()}
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
