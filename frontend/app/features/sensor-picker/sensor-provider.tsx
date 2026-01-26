import { useState } from "react";
import type { Sensor } from "./sensors";
import { SensorContext } from "./use-sensor";

export function SensorProvider({ children }: { children: React.ReactNode }) {
	const sensorFromPath = window.location.pathname.slice(1) as Sensor;

	const [sensor, setSensor] = useState<Sensor>(sensorFromPath || "dust");

	return (
		<SensorContext value={{ sensor, setSensor }}>{children}</SensorContext>
	);
}
