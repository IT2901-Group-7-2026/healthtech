import { Notifications } from "@/components/notifications";
import { BasePopup } from "./base-popup";

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
