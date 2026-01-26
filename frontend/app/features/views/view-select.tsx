import { SelectMenu } from "@/components/select-menu";
import { useView } from "./use-view";
import { views } from "./views";

export function ViewSelect() {
	const { view, setView } = useView();
	return (
		<SelectMenu
			options={{
				label: "views",
				key: "views",
				items: Array.from(views),
			}}
			onChange={setView}
			placeholder="Views"
			defaultValue={view}
		/>
	);
}
