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
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import { useView } from "./use-view";
import type { View } from "./utils";
import { views } from "./utils";

export function ViewPicker() {
	const formatDate = useFormatDate();
	const { view, setView } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const locale = i18n.language;

	return (
		<Select value={view} onValueChange={(value: View) => setView(value)}>
			<SelectTrigger className="w-57">
				<SelectValue>
					{formatSelectedView(view, date, locale, formatDate)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="w-57">
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
	locale: string,
	formatDate: ReturnType<typeof useFormatDate>,
) {
	const isEn = locale === "en";

	if (view === "day") {
		return formatDate(date, isEn ? "MMMM do yyyy" : "d. MMMM yyyy");
	}

	if (view === "week") {
		const start = startOfWeek(date, { weekStartsOn: 1 });
		const end = endOfWeek(date, { weekStartsOn: 1 });

		const startStr = formatDate(start, isEn ? "MMM do" : "d. MMM");
		const endStr = formatDate(end, isEn ? "MMM do yyyy" : "d. MMM yyyy");

		return `${startStr} - ${endStr}`;
	}

	return capitalize(formatDate(date, "MMMM yyyy"));
}
