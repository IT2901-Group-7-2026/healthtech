import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

// biome-ignore lint: default export in config files is fine
export default [
	layout("routes/layout.tsx", [
		index("routes/landing.tsx"),
		route("/operator/", "routes/operator/home.tsx"),
		route("/foreman/", "routes/foreman/overview.tsx"),
		layout("routes/operator/sensors/sensor-layout.tsx", [
			route("/operator/dust", "routes/operator/sensors/dust.tsx"),
			route(
				"/operator/vibration",
				"routes/operator/sensors/vibration.tsx",
			),
			route("/operator/noise", "routes/operator/sensors/noise.tsx"),
		]),
		route("/foreman/team", "routes/foreman/team.tsx"),
	]),
] satisfies RouteConfig;
