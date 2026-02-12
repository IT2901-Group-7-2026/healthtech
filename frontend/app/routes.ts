import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

// biome-ignore lint: default export in config files is fine
export default [
	layout("routes/layout.tsx", [
		index("routes/home.tsx"),
		layout("routes/sensors/sensor-layout.tsx", [
			route("/dust", "routes/sensors/dust.tsx"),
			route("/vibration", "routes/sensors/vibration.tsx"),
			route("/noise", "routes/sensors/noise.tsx"),
		]),
		route("/foreman/team", "routes/foreman/team.tsx"),
	]),
] satisfies RouteConfig;
