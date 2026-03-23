import { SensorIcon } from "@/components/sensor-icon";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { getNextDay, getPrevDay } from "@/lib/utils";
import { Button } from "@/ui/button";
import { t } from "i18next";
import { Outlet, useLocation } from "react-router";

function Title({ sensor }: { sensor: Sensor }) {
	return (
		<div className="flex shrink-0 items-center gap-3 py-2">
			<SensorIcon type={sensor} size="lg" />
			<h1 className="text-3xl">{t(($) => $[sensor])} </h1>
		</div>
	);
}

export default function SensorLayout() {
	const { date, setDate } = useDate();
	const { view } = useView();

	const location = useLocation();
	const sensor = location.pathname.split("/")[2] as Sensor;

	return (
		<section className="flex w-full flex-col">
			<div className="flex flex-row">
				<Title sensor={sensor} />
				<div className="flex w-full items-center">
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
			</div>
			<Outlet />
		</section>
	);
}
