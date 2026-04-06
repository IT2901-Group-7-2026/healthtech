import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { NotificationPopup } from "@/features/popups/notification-popup";
import { usePopup } from "@/features/popups/use-popup";
import { useUser } from "@/features/user/user-context";
import { TIMEZONE } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Sensor } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { TZDate } from "@date-fns/tz";
import { formatDate } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SensorIcon } from "./sensor-icon";

const notifications: Array<{
	sensor: Sensor;
	dangerLevel: DangerLevel;
	date: TZDate;
}> = [
	{
		sensor: "dust",
		dangerLevel: "warning",
		// "18.11 9.41" → 18 November 2024, 09:41
		date: new TZDate(2026, 3, 7, 9, 0, "Europe/Oslo"),
	},
	{
		sensor: "noise",
		dangerLevel: "warning",
		// "12.05 14.04" → 12 May 2025, 14:04
		date: new TZDate(2026, 3, 6, 9, 0, "Europe/Oslo"),
	},
	{
		sensor: "vibration",
		dangerLevel: "warning",
		// "12.05 14.04" → 12 May 2025, 14:04
		date: new TZDate(2026, 3, 1, 12, 10, "Europe/Oslo"),
	},
	{
		sensor: "noise",
		dangerLevel: "danger",
		// "12.05 14.04" → 12 May 2025, 14:04
		date: new TZDate(2026, 3, 1, 9, 10, "Europe/Oslo"),
	},
];

type NotifData = {
	date: TZDate;
	sensor: Sensor;
	dangerLevel: DangerLevel;
};

export function Notifications({ onParentClose }: { onParentClose: () => void }) {
	const { t, i18n } = useTranslation();
	const { visible, openPopup, closePopup } = usePopup();
	const { user } = useUser();

	const [notifData, setNotifData] = useState<NotifData | null>(null);

	// Since notifications are nested in a parent popup we need to close that popup as well as the popup for a specific notification.
	const closeAll = () => {
		closePopup();
		onParentClose();
	};

	function handleNotifClick(clickedNotif: NotifData): void {
		setNotifData(clickedNotif);
		openPopup();
	}

	const notificationLink = user.role === "foreman" ? `/foreman` : `/operator/${notifData?.sensor}`;

	let notificationLinkSearch = "";
	if (user.role === "foreman" && notifData) {
		const formattedDate = formatDate(notifData.date, "yyyy-MM-dd");
		notificationLinkSearch = `?sensor=${notifData.sensor}&filterDate=${formattedDate}`;
	}

	return (
		<>
			<Card className="h-64 w-full gap-0 overflow-y-auto px-4">
				<ItemGroup className="gap-1" role="list">
					{notifications.map(({ sensor, date, dangerLevel }) => (
						<button
							type={"button"}
							key={`${date} ${sensor} ${dangerLevel}`}
							onClick={() => handleNotifClick({ date, sensor, dangerLevel })}
							className="cursor-pointer"
						>
							<Item
								variant="outline"
								role="listitem"
								size="sm"
								className="rounded-3xl border-3 border-border bg-background hover:bg-card-highlight"
							>
								<SensorIcon type={sensor} size="md" dangerLevel={dangerLevel} />
								<ItemContent>
									<ItemTitle className="line-clamp-1">{t(($) => $[sensor])}</ItemTitle>
									<ItemDescription className={cn(`text-${dangerLevel}`)}>
										{t(($) => $[dangerLevel])}
									</ItemDescription>
								</ItemContent>
								<ItemContent>
									<span>{formatNotificationDate(date)}</span>
								</ItemContent>
							</Item>
						</button>
					))}
				</ItemGroup>
			</Card>
			{notifData && (
				<NotificationPopup
					open={visible}
					onClose={closeAll}
					relevantDate={notifData.date}
					title={t(($) => $.popup.notifTitle, {
						date: notifData.date.toLocaleDateString(i18n.language, {
							day: "numeric",
							month: "long",
							hour: "2-digit",
							minute: "2-digit",
						}),
					})}
					pathname={notificationLink}
					search={notificationLinkSearch}
				>
					<div className="flex justify-start gap-2">
						<span
							className={cn(
								"rounded-full text-center font-medium capitalize",
								`bg-${notifData.dangerLevel} ${notifData.dangerLevel === "danger" && "text-secondary"}`,
								"h-fit w-fit px-2",
							)}
						>
							{t(($) => $[notifData.sensor as Sensor])}
						</span>
						<span className="text-muted-foreground">{"->"}</span>
						<div className={`text-${notifData.dangerLevel}`}>
							{t(($) => $.popup[notifData.dangerLevel])}
						</div>
					</div>
				</NotificationPopup>
			)}
		</>
	);
}

const formatNotificationDate = (date: TZDate): string => formatDate(date, "dd.MM HH.mm", { in: TIMEZONE });
