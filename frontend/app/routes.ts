import {
	index,
	layout,
	type RouteConfig,
	route,
} from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		index("routes/landing.tsx"),
		route("/foreman/", "routes/foreman/overview.tsx"),
		layout("routes/operator/sensors/sensor-layout.tsx", [
			route("/operator/dust", "routes/operator/sensors/dust.tsx"),
			route(
				"/operator/vibration",
				"routes/operator/sensors/vibration.tsx",
			),
			route("/operator/noise", "routes/operator/sensors/noise.tsx"),
			route("/operator/", "routes/operator/home.tsx"),
		]),
		route("/foreman/team", "routes/foreman/team.tsx"),
	]),
	route("/register", "routes/register.tsx"),
] satisfies RouteConfig;
