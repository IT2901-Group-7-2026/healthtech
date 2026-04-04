import { DatePicker } from "@/components/ui/date-picker.js";
import { useDate } from "@/features/date-picker/use-date";
import { useView } from "@/features/views/use-view";
import { Outlet } from "react-router";

export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { view } = useView();

	return (
		<section className="flex w-full flex-col gap-2">
			<DatePicker
				mode={view}
				showWeekNumber
				date={date}
				onDateChange={setDate}
				withViewSelect
			/>
			<Outlet />
		</section>
	);
}
