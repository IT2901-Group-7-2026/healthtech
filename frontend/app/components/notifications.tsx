import { useUser } from "@/features/user/user-context";
import { TIMEZONE } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Exposure } from "@/lib/exposures";
import { cn } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { ExposureIcon } from "./exposure-icon";

const notifications: Array<{
	exposure: Exposure;
	dangerLevel: DangerLevel;
	date: TZDate;
}> = [
	{
		exposure: "dust",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 7, 9, 0, "Europe/Oslo"),
	},
	{
		exposure: "noise",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 6, 9, 0, "Europe/Oslo"),
	},
	{
		exposure: "vibration",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 3, 15, 40, "Europe/Oslo"),
	},
	{
		exposure: "noise",
		dangerLevel: "danger",
		date: new TZDate(2026, 3, 1, 9, 10, "Europe/Oslo"),
	},
];

export function Notifications({ onParentClose }: { onParentClose: () => void }) {
	const { t } = useTranslation();
	const { user } = useUser();

	return (
		<ul className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
			{notifications.map(({ exposure, date, dangerLevel }) => {
				const notificationLink = user.role === "foreman" ? `/foreman` : `/operator/${exposure}`;
				let notificationLinkSearch = "";

				if (user.role === "foreman") {
					const formattedDate = formatDate(date, "yyyy-MM-dd");
					notificationLinkSearch = `?exposure=${exposure}&date=${formattedDate}`;
				} else {
					const formattedDate = formatDate(date, "yyyy-MM-dd");
					notificationLinkSearch = `?view=Day&date=${formattedDate}`;
				}

				return (
					<li key={`${date} ${exposure} ${dangerLevel}`}>
						<NavLink
							to={`${notificationLink}${notificationLinkSearch}`}
							onClick={onParentClose}
							className="flex items-center gap-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<ExposureIcon type={exposure} size="md" dangerLevel={dangerLevel} />

							<div className="flex flex-col justify-center gap-1">
								<span className="font-medium text-sm">{t(($) => $.exposures[exposure])}</span>
								<span className={cn("font-semibold text-xs", `text-${dangerLevel}`)}>
									{t(($) => $.dangerLevels[dangerLevel])}
								</span>
							</div>

							<time
								dateTime={date.toISOString()}
								className="flex shrink-0 flex-col items-end gap-1 text-muted-foreground text-xs tabular-nums"
							>
								<span>{formatDate(date, "dd.MM.yyyy", { in: TIMEZONE })}</span>
								<span>{formatDate(date, "HH:mm", { in: TIMEZONE })}</span>
							</time>
						</NavLink>
					</li>
				);
			})}
		</ul>
	);
}
