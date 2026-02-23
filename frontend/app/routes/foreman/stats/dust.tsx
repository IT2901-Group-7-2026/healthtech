import { useTranslation } from "react-i18next";

const ForemanDustStatsPage = () => {
	const { t } = useTranslation();

	return (
		<div>
			<h2 className="text-2xl">{t("foremanDashboard.stats.dust")}</h2>
		</div>
	);
};

// biome-ignore lint: page components can be default exports
export default ForemanDustStatsPage;
