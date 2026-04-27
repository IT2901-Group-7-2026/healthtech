import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		index("routes/landing.tsx"),
		route("/foreman/", "routes/foreman/overview.tsx"),
		layout("routes/operator/exposures/exposure-layout.tsx", [
			route("/operator/dust", "routes/operator/exposures/dust.tsx"),
			route("/operator/vibration", "routes/operator/exposures/vibration.tsx"),
			route("/operator/noise", "routes/operator/exposures/noise.tsx"),
			route("/operator/", "routes/operator/home.tsx"),
		]),
		route("/operator/live", "routes/operator/live.tsx"),
		route("/foreman/team", "routes/foreman/team.tsx"),
		route("/foreman/map", "routes/foreman/map.tsx"),
	]),
	route("/register", "routes/register.tsx"),
] satisfies RouteConfig;
