import { useTranslation } from "react-i18next";

const StatsPage = () => {
	const { t } = useTranslation();

	return (
		<div>
			<h2 className="text-2xl">
				{t(($) => $.foremanDashboard.stats.all)}
			</h2>
		</div>
	);
};

// biome-ignore lint/style/noDefaultExport: page components can be default exports
export default StatsPage;
