import { BasePopup } from "./base-popup";

export function NotificationPopup({
	title,
	relevantDate,
	open,
	onClose,
	pathname,
	children,
}: {
	title: string;
	relevantDate: Date;
	open: boolean;
	onClose: () => void;
	pathname?: string;
	children?: React.ReactNode;
}) {
	return (
		<BasePopup
			title={title}
			open={open}
			relevantDate={relevantDate}
			onClose={onClose}
			pathname={pathname ? pathname : undefined}
		>
			{children}
		</BasePopup>
	);
}
