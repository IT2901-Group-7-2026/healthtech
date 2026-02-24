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
	relevantViewMode?: string;
	navOverride?: string;
	pathname?: string;
	children: React.ReactNode;
};

export function BasePopup({
	title,
	open,
	onClose,
	relevantDate,
	relevantViewMode,
	navOverride,
	pathname,
	children,
}: BasePopupProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full max-w-6xl">
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
										: //TODO: Find better name for viewmode
											`?view=Day&date=${relevantDate.toISOString().split("T")[0]}${relevantViewMode ? `&viewMode=${relevantViewMode}` : ""}`,
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
