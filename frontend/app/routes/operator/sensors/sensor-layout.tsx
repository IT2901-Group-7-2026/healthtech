import { useDate } from "@/features/date-picker/use-date";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { getNextDay, getPrevDay } from "@/lib/utils";
import { Button } from "@/ui/button";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { view } = useView();
	const { t } = useTranslation();

	return (
		<section className="flex w-full flex-col">
			<div className="flex flex-row">
				<div className="mb-2 flex w-full flex-row justify-end gap-4">
					<Button
						onClick={() => setDate(new Date())}
						size={"icon"}
						className="px-8"
					>
						{t(($) => $.today)}
					</Button>
					<Button
						onClick={() => setDate(getPrevDay(date, view))}
						size={"icon"}
					>
						{"<"}
					</Button>
					<ViewPicker />
					<Button
						onClick={() => setDate(getNextDay(date, view))}
						size={"icon"}
					>
						{">"}
					</Button>
				</div>
			</div>
			<Outlet />
		</section>
	);
}
