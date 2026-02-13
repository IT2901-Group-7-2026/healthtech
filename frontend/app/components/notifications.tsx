import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Icon } from "@/features/icon";
import { NotificationPopup } from "@/features/popups/notification-popup";
import { usePopup } from "@/features/popups/use-popup";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Sensor } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const notifications: Array<{
	sensor: Sensor;
	dangerLevel: DangerLevel;
	date: Date;
}> = [
	{
		sensor: "noise",
		dangerLevel: "warning",
		// "18.11 9.41" → 18 November 2024, 09:41
		date: new Date(2024, 10, 18, 9, 41),
	},
	{
		sensor: "vibration",
		dangerLevel: "danger",
		// "12.05 14.04" → 12 May 2025, 14:04
		date: new Date(2025, 4, 12, 14, 4),
	},
	{
		sensor: "dust",
		dangerLevel: "warning",
		// "17.02 8.53" → 17 February 2025, 08:53
		date: new Date(2025, 1, 17, 8, 53),
	},
	{
		sensor: "dust",
		dangerLevel: "warning",
		// "20.02 8.54" → 20 February 2025, 08:54
		date: new Date(2025, 1, 20, 8, 54),
	},
];

type NotifData = {
	date: Date;
	sensor: Sensor;
	dangerLevel: DangerLevel;
};

export function Notifications({
	onParentClose,
}: {
	onParentClose: () => void;
}) {
	const { t, i18n } = useTranslation();

	const { visible, openPopup, closePopup } = usePopup();

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

	return (
		<>
			<Card className="h-64 w-full gap-0 overflow-y-auto px-4">
				<ItemGroup className="gap-1" role="list">
					{notifications.map(({ sensor, date, dangerLevel }) => (
						<button
							type={"button"}
							key={`${date} ${sensor} ${dangerLevel}`}
							onClick={() =>
								handleNotifClick({ date, sensor, dangerLevel })
							}
							className="cursor-pointer"
						>
							<Item
								variant="outline"
								role="listitem"
								size="sm"
								className="rounded-3xl border-3 border-border bg-background hover:bg-card-highlight"
							>
								<ItemMedia variant="default" className="pt-1">
									<Icon variant={sensor} size="medium" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle className="line-clamp-1">
										{t(($) => $[sensor])}
									</ItemTitle>
									<ItemDescription
										className={cn(`text-${dangerLevel}`)}
									>
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
					pathname={`/${notifData.sensor}`}
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

// Parses Date objects into the previous string format of dd.mm hh.mm
function formatNotificationDate(date: Date): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");

	return `${day}.${month} ${hour}.${minute}`;
}
