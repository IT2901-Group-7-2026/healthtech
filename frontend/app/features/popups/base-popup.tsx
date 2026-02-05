import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { t } from "i18next";
import { NavLink } from "react-router";
import { sensors } from "../sensor-picker/sensors";
import { useSensor } from "../sensor-picker/use-sensor";

type BasePopupProps = {
	title: string;
	open: boolean;
	onClose: () => void;
	relevantDate: Date | null;
	navOverride?: string;
	pathname?: string;
	children: React.ReactNode;
};

export function BasePopup({
	title,
	open,
	onClose,
	relevantDate,
	navOverride,
	pathname,
	children,
}: BasePopupProps) {
	const { setSensor } = useSensor();
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold text-xl">{title}</DialogTitle>
				</DialogHeader>

				{children}

				<DialogFooter>
					{relevantDate && (
						<Button
							variant="default"
							className="cursor-pointer"
							onClick={onClose}
						>
							<NavLink
								to={{
									pathname: pathname ? pathname : "",
									search: navOverride
										? navOverride
										: `?view=Day&date=${relevantDate.toLocaleDateString("en-CA")}`,
								}}
								onClick={() =>
									sensors.find((s) => pathname?.includes(s) && setSensor(s))
								}
								prefetch="intent"
							>
								{t(($) => $.popup.toDay)}
							</NavLink>
						</Button>
					)}
					{/* <Button
						variant="destructive"
						onClick={onClose}
						className="cursor-pointer"
					>
						{t(($) => $.buttons.close)}
					</Button> */}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
