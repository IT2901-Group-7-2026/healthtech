import { useDate } from "@/features/date-picker/use-date";
import { Icon } from "@/features/icon";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { getNextDay, getPrevDay } from "@/lib/utils";
import { Button } from "@/ui/button";
import { t } from "i18next";
import { Outlet } from "react-router";

function Title({ sensor }: { sensor: Sensor }) {
	return (
		<h1 className="p-2 text-3xl">
			{t(($) => $[sensor])}{" "}
			<span>
				<Icon variant={sensor} size="medium" />
			</span>
		</h1>
	);
}

export default function SensorLayout({ sensor }: { sensor: Sensor }) {
	const { date, setDate } = useDate();
	const { view } = useView();

	return (
		<section className="flex w-full flex-col">
			{/* Header */}
			<div className="flex flex-row">
				<Title sensor={sensor} />
				<div className="ml-auto flex flex-row gap-4">
					<Button
						onClick={() => setDate(new Date())}
						size={"icon"}
						className="px-8"
					>
						{"Today"}
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
			{/* Page content */}
			<Outlet />
		</section>
	);
}
