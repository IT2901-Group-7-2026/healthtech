import { createContext, useContext } from "react";
import type { Sensor } from "./sensors";

type ContextValue = {
	sensor: Sensor;
	setSensor: (sensor: Sensor) => void;
};

export const SensorContext = createContext<ContextValue | null>(null);

export function useSensor() {
	const context = useContext(SensorContext);

	if (!context) {
		throw new Error("useView must be used within a ViewContextProvider");
	}

	return context;
}
