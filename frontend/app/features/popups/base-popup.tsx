import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormatDate } from "@/hooks/use-format-date.js";
import type { TZDate } from "@date-fns/tz";
import { t } from "i18next";
import { NavLink } from "react-router";

type BasePopupProps = {
	title: string;
	open: boolean;
	onClose: () => void;
	relevantDate: TZDate | null;
	selectedAggregation?: string;
	navOverride?: string;
	pathname?: string;
	children: React.ReactNode;
};

export function BasePopup({
	title,
	open,
	onClose,
	relevantDate,
	selectedAggregation,
	navOverride,
	pathname,
	children,
}: BasePopupProps) {
	const formatDate = useFormatDate();
	let search = navOverride;

	if (!search && relevantDate) {
		const date = formatDate(relevantDate, "yyyy-MM-dd");
		search = `?view=Day&date=${date}`;

		if (selectedAggregation) {
			search += `&aggregation=${selectedAggregation}`;
		}
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full max-w-6xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				{children}

				{relevantDate && (
					<DialogFooter>
						<Button variant="default" className="cursor-pointer" onClick={onClose}>
							<NavLink
								to={{
									pathname: pathname ?? "",
									search,
								}}
								prefetch="intent"
							>
								{t(($) => $.popup.toDay)}
							</NavLink>
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
