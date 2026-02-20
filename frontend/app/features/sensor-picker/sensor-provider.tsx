import { useState } from "react";
import type { Sensor } from "./sensors";
import { SensorContext } from "./use-sensor";
import { useParams } from "react-router";

export function SensorProvider({ children }: { children: React.ReactNode }) {
	const sensorFromPath = useParams().sensorType as Sensor;

	const [sensor, setSensor] = useState<Sensor>(sensorFromPath);

	return (
		<SensorContext value={{ sensor, setSensor }}>{children}</SensorContext>
	);
}
