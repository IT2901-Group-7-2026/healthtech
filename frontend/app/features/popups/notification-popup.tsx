import type { TZDate } from "@date-fns/tz";
import { BasePopup } from "./base-popup";

export function NotificationPopup({
	title,
	relevantDate,
	open,
	onClose,
	pathname,
	search,
	children,
}: {
	title: string;
	relevantDate: TZDate;
	open: boolean;
	onClose: () => void;
	pathname?: string;
	search?: string;
	children?: React.ReactNode;
}) {
	return (
		<BasePopup
			title={title}
			open={open}
			relevantDate={relevantDate}
			onClose={onClose}
			pathname={pathname}
			navOverride={search}
		>
			{children}
		</BasePopup>
	);
}
