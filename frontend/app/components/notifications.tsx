import { useUser } from "@/features/user/user-context.tsx";
import { useFormatDate } from "@/hooks/use-format-date.ts";
import type { DangerLevel } from "@/lib/danger-levels.ts";
import type { Exposure } from "@/lib/exposures.ts";
import { cn } from "@/lib/utils.ts";
import { TZDate } from "@date-fns/tz";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { ExposureIcon } from "./exposure-icon.tsx";

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
	const formatNotificationDate = useFormatDate();

	return (
		<ul className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
			{notifications.map(({ exposure, date, dangerLevel }) => {
				const notificationLink = user.role === "foreman" ? `/foreman` : `/operator/${exposure}`;
				let notificationLinkSearch = "";
				const isCurrentYear =
					formatNotificationDate(date, "yyyy") === formatNotificationDate(new Date(), "yyyy");
				const dateFormat = isCurrentYear ? "MMM d" : "MMM d, yyyy";

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
							className="flex gap-3 px-2 py-2.5 transition-colors hover:bg-accent"
						>
							<ExposureIcon type={exposure} size="md" dangerLevel={dangerLevel} />

							<div className="flex flex-1 flex-col gap-0.5">
								<span className="font-medium text-sm">{t(($) => $.exposures[exposure])}</span>
								<span className={cn("font-semibold text-xs", `text-${dangerLevel}`)}>
									{t(($) => $.dangerLevels[dangerLevel])}
								</span>
							</div>

							<time
								dateTime={date.toISOString()}
								className="shrink-0 text-muted-foreground text-xs tabular-nums"
							>
								{formatNotificationDate(date, dateFormat)} {"-"} {formatNotificationDate(date, "HH:mm")}
							</time>
						</NavLink>
					</li>
				);
			})}
		</ul>
	);
}
