import { useTranslation } from "react-i18next";

const ForemanNoiseStatsPage = () => {
	const { t } = useTranslation();

	return (
		<div>
			<h2 className="text-2xl">
				{t(($) => $.foremanDashboard.stats.noise)}
			</h2>
		</div>
	);
};

// biome-ignore lint: page components can be default exports
export default ForemanNoiseStatsPage;
