import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { useUser } from "@/features/user/user-context";
import { TIMEZONE } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Sensor } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { TZDate } from "@date-fns/tz";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { SensorIcon } from "./sensor-icon";

const notifications: Array<{
	sensor: Sensor;
	dangerLevel: DangerLevel;
	date: TZDate;
}> = [
	{
		sensor: "dust",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 7, 9, 0, "Europe/Oslo"),
	},
	{
		sensor: "noise",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 6, 9, 0, "Europe/Oslo"),
	},
	{
		sensor: "vibration",
		dangerLevel: "warning",
		date: new TZDate(2026, 3, 3, 15, 40, "Europe/Oslo"),
	},
	{
		sensor: "noise",
		dangerLevel: "danger",
		date: new TZDate(2026, 3, 1, 9, 10, "Europe/Oslo"),
	},
];

export function Notifications({ onParentClose }: { onParentClose: () => void }) {
	const { t } = useTranslation();
	const { user } = useUser();

	return (
		<Card className="h-64 w-full gap-0 overflow-y-auto px-4">
			<ItemGroup className="gap-1" role="list">
				{notifications.map(({ sensor, date, dangerLevel }) => {
					const notificationLink = user.role === "foreman" ? `/foreman` : `/operator/${sensor}`;
					let notificationLinkSearch = "";

					if (user.role === "foreman") {
						const formattedDate = formatDate(date, "yyyy-MM-dd");
						notificationLinkSearch = `?sensor=${sensor}&filterDate=${formattedDate}`;
					} else {
						const formattedDate = formatDate(date, "yyyy-MM-dd");
						notificationLinkSearch = `?view=Day&date=${formattedDate}`;
					}

					return (
						<NavLink
							key={`${date} ${sensor} ${dangerLevel}`}
							to={`${notificationLink}${notificationLinkSearch}`}
							className="cursor-pointer"
							onClick={onParentClose}
						>
							<Item
								variant="outline"
								role="listitem"
								size="sm"
								className="rounded-3xl border-3 border-border bg-background hover:bg-card-highlight"
							>
								<SensorIcon type={sensor} size="md" dangerLevel={dangerLevel} />
								<ItemContent>
									<ItemTitle className="line-clamp-1">{t(($) => $.sensors[sensor])}</ItemTitle>
									<ItemDescription className={cn(`text-${dangerLevel}`)}>
										{t(($) => $.dangerLevels[dangerLevel])}
									</ItemDescription>
								</ItemContent>
								<ItemContent>
									<span>{formatNotificationDate(date)}</span>
								</ItemContent>
							</Item>
						</NavLink>
					);
				})}
			</ItemGroup>
		</Card>
	);
}

const formatNotificationDate = (date: TZDate): string => formatDate(date, "dd.MM HH.mm", { in: TIMEZONE });
