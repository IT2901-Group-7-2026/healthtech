import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { t } from "i18next";
import { useView } from "./use-view";
import type { View } from "./utils";
import { views } from "./utils";

export function ViewPicker() {
	const { view, setView } = useView();
	return (
		<Select value={view} onValueChange={(value: View) => setView(value)}>
			<SelectTrigger className="w-32">
				<SelectValue placeholder="View" />
			</SelectTrigger>
			<SelectContent className="w-32">
				{views.map((v: View) => (
					<SelectItem key={v} value={v}>
						{t(($) => $[v])}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
