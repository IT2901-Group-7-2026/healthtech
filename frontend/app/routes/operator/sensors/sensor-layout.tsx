import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { DatePicker } from "@/components/ui/date-picker.js";
import { useDate } from "@/features/date-picker/use-date";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { today } from "@/lib/date";
import { getNextDay, getPrevDay } from "@/lib/utils";
import { Button } from "@/ui/button";

export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { view } = useView();

	return (
		<section className="flex w-full flex-col gap-2">
			<div className="flex flex-row">
				<DatePicker
					mode={view}
					showWeekNumber
					date={date}
					onDateChange={setDate}
					footer={
						<div className="pt-2">
							<ViewPicker />
						</div>
					}
				/>
			</div>
			<Outlet />
		</section>
	);
}
