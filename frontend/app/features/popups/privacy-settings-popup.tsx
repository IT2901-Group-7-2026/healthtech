import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Field } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { useFormatDate } from "@/hooks/use-format-date";
import { now } from "@/lib/date";
import { TZDate } from "@date-fns/tz";
import { isBefore } from "date-fns";
import { Share, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
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
		defaultValues: { fromDate: undefined, toDate: undefined },
		mode: "onChange",
	});

	const deleteFrom = form.watch("fromDate");
	const deleteTo = form.watch("toDate");
	const formatDate = useFormatDate();

	const shareForm = useForm<DateFormValues>({
		defaultValues: { fromDate: undefined, toDate: undefined },
		mode: "onChange",
	});
	const shareFrom = shareForm.watch("fromDate");
	const shareTo = shareForm.watch("toDate");

	const MIN_DATA_DATE = new TZDate(2025, 0, 1, "Europe/Oslo");
	const MAX_DATA_DATE = now();
	const TIMEOUT_5000_MS = 5000;

	const [showDeleteText, setDeleteText] = useState(false);
	const [showShareDataConfirmationMessage, setShowShareDataConfirmationMessage] = useState(false);

	const handleShareSubmit = useCallback(() => {
		if (shareFrom && shareTo) {
			setShowShareDataConfirmationMessage(true);
			setTimeout(() => setShowShareDataConfirmationMessage(false), TIMEOUT_5000_MS);
		}
	}, [shareFrom, shareTo]);

	const handleSubmit = useCallback(
		(data: DateFormValues) => {
			if (data.fromDate && data.toDate && isBefore(data.toDate, data.fromDate)) {
				form.setError("toDate", { message: t(($) => $.popup.invalidDate) });
				setTimeout(() => form.clearErrors("toDate"), TIMEOUT_5000_MS);
				return;
			}
			setDeleteText(true);
			setTimeout(() => setDeleteText(false), TIMEOUT_5000_MS);
		},
		[form, t],
	);

	const handleShareRangeChange = (range: { from?: TZDate; to?: TZDate }) => {
		shareForm.setValue("fromDate", range.from);
		shareForm.setValue("toDate", range.to);
	};

	const handleDeleteRangeChange = (range: { from?: TZDate; to?: TZDate }) => {
		form.setValue("fromDate", range.from);
		form.setValue("toDate", range.to);
	};

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="mx-auto flex flex-col gap-4 pt-6 text-sm">
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.share.hygienist.button)}</p>
					<Form {...shareForm}>
						<form onSubmit={shareForm.handleSubmit(handleShareSubmit)} className="space-y-2">
							<div className="flex flex-col gap-2 sm:flex-row">
								<Field className="w-74">
									<DateRangePicker
										value={{ from: shareFrom, to: shareTo }}
										onChange={handleShareRangeChange}
										minDate={MIN_DATA_DATE}
										maxDate={MAX_DATA_DATE}
										placeholder={t(($) => $.popup.pickDate)}
									/>
								</Field>

								<Button type="submit" disabled={!(shareFrom && shareTo)} className="w-fit">
									<Share />
									{t(($) => $.share.hygienist.shareData)}
								</Button>
							</div>

							<div className="relative min-h-4">
								{showShareDataConfirmationMessage && shareFrom && shareTo && (
									<p
										className={`absolute inset-0 text-green-700 text-xs ${
											showShareDataConfirmationMessage
												? "visible opacity-100"
												: "invisible opacity-0"
										}`}
									>
										{t(($) => $.share.hygienist.confirmation, {
											from: formatDate(shareFrom, "d MMMM yyyy"),
											to: formatDate(shareTo, "d MMMM yyyy"),
										})}
									</p>
								)}
							</div>
						</form>
					</Form>
				</div>

				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.profile.deletePersonalInformation)}</p>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
							<div className="flex flex-col gap-2 sm:flex-row">
								<Field className="w-74">
									<DateRangePicker
										value={{ from: deleteFrom, to: deleteTo }}
										onChange={handleDeleteRangeChange}
										minDate={MIN_DATA_DATE}
										maxDate={MAX_DATA_DATE}
										placeholder={t(($) => $.popup.pickDate)}
									/>
								</Field>

								<Button
									type="submit"
									disabled={!(deleteFrom && deleteTo)}
									variant="destructive"
									className="w-fit"
								>
									<Trash2 />
									{t(($) => $.popup.deleteData)}
								</Button>
							</div>

							<div className="relative min-h-4">
								{showDeleteText && deleteFrom && deleteTo && (
									<p
										className={`absolute inset-0 text-green-700 text-xs ${
											showDeleteText ? "visible opacity-100" : "invisible opacity-0"
										}`}
									>
										{t(($) => $.popup.dataDeleted, {
											from: formatDate(deleteFrom, "d MMMM yyyy"),
											to: formatDate(deleteTo, "d MMMM yyyy"),
										})}
									</p>
								)}
							</div>
						</form>
					</Form>
				</div>
			</div>
		</BasePopup>
	);
}
