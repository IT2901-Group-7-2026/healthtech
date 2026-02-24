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
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold text-xl">
						{title}
					</DialogTitle>
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
										: `?view=Day&date=${relevantDate.toISOString().split("T")[0]}`,
								}}
								prefetch="intent"
							>
								{t(($) => $.popup.toDay)}
							</NavLink>
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
