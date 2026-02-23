import { t } from "i18next";
import { Outlet } from "react-router";
import { useDate } from "@/features/date-picker/use-date";
import { Icon } from "@/features/icon";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useSensor } from "@/features/sensor-picker/use-sensor";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { getNextDay, getPrevDay } from "@/lib/utils";
import { Button } from "@/ui/button";

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

// biome-ignore lint/style/noDefaultExport: react router needs default export
export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { view } = useView();
	const { sensor } = useSensor();

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
