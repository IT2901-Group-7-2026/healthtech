import { useFormatDate } from "@/hooks/use-format-date";
import { capitalize } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { endOfWeek, startOfWeek } from "date-fns";
import { t } from "i18next";
import { useDate } from "../date-picker/use-date";
import { useView } from "./use-view";
import type { View } from "./utils";
import { views } from "./utils";

export function ViewPicker() {
	const formatDate = useFormatDate();
	const { view, setView } = useView();
	const { date } = useDate();

	return (
		<Select value={view} onValueChange={(value: View) => setView(value)}>
			<SelectTrigger className="w-50">
				<SelectValue>
					{formatSelectedView(view, date, formatDate)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="w-50">
				{views.map((v: View) => (
					<SelectItem key={v} value={v}>
						{t(($) => $[v])}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function formatSelectedView(
	view: View,
	date: Date,
	formatDate: ReturnType<typeof useFormatDate>,
) {
	if (view === "day") {
		return formatDate(date, "PPP");
	}

	if (view === "week") {
		const start = startOfWeek(date, { weekStartsOn: 1 });
		const end = endOfWeek(date, { weekStartsOn: 1 });

		const startStr = formatDate(start, "d MMM");
		const endStr = formatDate(end, "d MMM yyyy");

		return `${startStr} - ${endStr}`;
	}

	return capitalize(formatDate(date, "LLLL yyyy"));
}
