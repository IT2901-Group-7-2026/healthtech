import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Field } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { useFormatDate } from "@/hooks/use-format-date";
import { now } from "@/lib/date";
import { TZDate } from "@date-fns/tz";
import { isBefore } from "date-fns";
import { Share2, Trash2 } from "lucide-react";
import { useCallback, useState } from "react"; // ← added useId
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BasePopup } from "./base-popup";

interface PrivacySettingsPopupProps {
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
}

export type DateFormValues = {
	fromDate?: TZDate;
	toDate?: TZDate;
};

export function PrivacySettingsPopup({ open, onClose, children }: PrivacySettingsPopupProps) {
	const { t } = useTranslation();
	const title = t(($) => $.profile.privacySettings);

	const form = useForm<DateFormValues>({
		defaultValues: {
			fromDate: undefined,
			toDate: undefined,
		},
		mode: "onChange",
	});

	const fromDate = form.watch("fromDate");
	const toDate = form.watch("toDate");
	const formatDate = useFormatDate();

	// We chose the minimum date to be the 1st of January 2025 because there is no data before this date
	const MIN_DATA_DATE = new TZDate(2025, 0, 1, "Europe/Oslo");
	const MAX_DATA_DATE = now();

	const [showDeleteText, setDeleteText] = useState(false);
	const [showShareDataConfirmationMessage, setShowShareDataConfirmationMessage] = useState(false);

	const handleShareClick = useCallback(() => {
		setShowShareDataConfirmationMessage(true);
		setTimeout(() => setShowShareDataConfirmationMessage(false), 5000);
	}, []);

	const handleSubmit = useCallback(
		(data: DateFormValues) => {
			if (data.fromDate && data.toDate && isBefore(data.toDate, data.fromDate)) {
				form.setError("toDate", { message: t(($) => $.popup.invalidDate) });
				setTimeout(() => form.clearErrors("toDate"), 5000);
				return;
			}
			setDeleteText(true);
			setTimeout(() => setDeleteText(false), 5000);
		},
		[form, t],
	);

	const handleRangeChange = (range: { from?: TZDate; to?: TZDate }) => {
		form.setValue("fromDate", range.from);
		form.setValue("toDate", range.to);
	};

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="flex flex-col gap-3 text-sm md:px-0 md:pb-1">
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.share.hygienist.button)}</p>
					<Card className="p-3">
						<div>
							<Button onClick={handleShareClick}>
								<Share2 />
								{t(($) => $.share.hygienist.shareData)}
							</Button>

							<div className="relative mt-2 h-2">
								<p
									className={`absolute inset-0 text-green-700 text-xs ${
										showShareDataConfirmationMessage ? "visible opacity-100" : "invisible opacity-0"
									}`}
								>
									{t(($) => $.share.hygienist.confirmation)}
								</p>
							</div>
						</div>
					</Card>
					<p className="label text-muted-foreground">{t(($) => $.profile.deletePersonalInformation)}</p>
					<Card className="p-3">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-sm space-y-2">
								<Field className="mx-auto w-full">
									<DateRangePicker
										value={{ from: fromDate, to: toDate }}
										onChange={handleRangeChange}
										minDate={MIN_DATA_DATE}
										maxDate={MAX_DATA_DATE}
										placeholder={t(($) => $.popup.pickDate)}
									/>
								</Field>
								<div className="relative mt-4">
									<Button type="submit" disabled={!(fromDate && toDate)} className="h-8 text-sm">
										<Trash2 />
										{t(($) => $.popup.deleteData)}
									</Button>
									<div className="relative mt-2 mb-4">
										{showDeleteText && fromDate && toDate && (
											<p
												className={`absolute inset-0 text-green-700 text-xs ${
													showDeleteText ? "visible opacity-100" : "invisible opacity-0"
												}`}
											>
												{t(($) => $.popup.dataDeleted, {
													from: formatDate(fromDate, "d MMMM yyyy"),
													to: formatDate(toDate, "d MMMM yyyy"),
												})}
											</p>
										)}
									</div>
								</div>
							</form>
						</Form>
					</Card>
				</div>
			</div>
		</BasePopup>
	);
}
