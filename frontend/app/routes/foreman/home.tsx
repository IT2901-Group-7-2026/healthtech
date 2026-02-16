/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { useUser } from "@/features/user/user-user";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import AtRiskTable from "./workersAtRiskTable"

// biome-ignore lint: page components can be default exports
export default function ForemanHome() {
	// const { t, i18n } = useTranslation();
	const navigate = useNavigate();

	// const { view } = useView();
	// const translatedView = t(($) => $.overview[view]);
	// const { date, setDate } = useDate();

	const { user } = useUser();

	useEffect(() => {
		if (user.role !== "foreman") {
			navigate("/");
			return;
		}
	}, [user, navigate]);

	return (
		<div className="flex w-full flex-col items-center md:items-start">
			{/* biome-ignore lint/nursery/noJsxLiterals: temporary */}
			<h1 className="text-4xl">Foreman</h1>
			<AtRiskTable />
		</div>
	);
}
