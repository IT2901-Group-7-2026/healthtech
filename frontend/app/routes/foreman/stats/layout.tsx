import { href, NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";

function getLinkClasses(isActive: boolean) {
	return isActive
		? "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
		: "rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
}

const ForemanStatsLayout = () => {
	const { t } = useTranslation();

	return (
		<section className="flex w-full flex-col gap-4">
			<h1 className="p-2 text-3xl">{t(($) => $.layout.statistics)}</h1>
			<nav className="flex w-fit gap-2">
				<NavLink
					to={href("/foreman/stats")}
					end
					className={({ isActive }) => getLinkClasses(isActive)}
				>
					{t(($) => $.foremanDashboard.stats.all)}
				</NavLink>
				<NavLink
					to={href("/foreman/stats/dust")}
					className={({ isActive }) => getLinkClasses(isActive)}
				>
					{t(($) => $.foremanDashboard.stats.dust)}
				</NavLink>
				<NavLink
					to={href("/foreman/stats/noise")}
					className={({ isActive }) => getLinkClasses(isActive)}
				>
					{t(($) => $.foremanDashboard.stats.noise)}
				</NavLink>
				<NavLink
					to={href("/foreman/stats/vibration")}
					className={({ isActive }) => getLinkClasses(isActive)}
				>
					{t(($) => $.foremanDashboard.stats.vibration)}
				</NavLink>
			</nav>
			<Outlet />
		</section>
	);
};

// biome-ignore lint: page components can be default exports
export default ForemanStatsLayout;
