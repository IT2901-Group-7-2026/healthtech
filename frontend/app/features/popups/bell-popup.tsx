import { Notifications } from "@/components/notifications.tsx";
import { BasePopup } from "./base-popup.tsx";

export function BellPopup({
	title,
	open,
	onClose,
	pathname,
	children,
}: {
	title: string;
	open: boolean;
	onClose: () => void;
	pathname?: string;
	children?: React.ReactNode;
}) {
	return (
		<BasePopup
			title={title}
			open={open}
			relevantDate={null}
			onClose={onClose}
			pathname={pathname ? pathname : undefined}
		>
			<Notifications onParentClose={onClose} />
			{children}
		</BasePopup>
	);
}
