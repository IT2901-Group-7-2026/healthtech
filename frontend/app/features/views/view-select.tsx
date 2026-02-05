import { SelectMenu } from "@/components/select-menu";
import { useTranslation } from "react-i18next";
import { useView } from "./use-view";
import { views } from "./views";

export function ViewSelect() {
	const { view, setView } = useView();
	const { t } = useTranslation();
	return (
		<SelectMenu
			options={{
				label: t(($) => $.views),
				key: "views",
				items: Array.from(views),
			}}
			onChange={setView}
			placeholder="Views"
			defaultValue={view}
		/>
	);
}
