import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { useFormatDate } from "@/hooks/use-format-date";
import { now } from "@/lib/date";
import { TZDate } from "@date-fns/tz";
import { isBefore } from "date-fns";
import { Share2 } from "lucide-react";
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
		defaultValues: {
			fromDate: undefined,
			toDate: undefined,
		},
		mode: "onChange",
	});

	const fromDate = form.watch("fromDate");
	const toDate = form.watch("toDate");
	const format = useFormatDate();

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

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="flex flex-col gap-3 text-sm md:px-0 md:pb-1">
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.share.hygienist.button)}</p>
					<Card className="p-3">
						<div>
							<Button variant="outline" onClick={handleShareClick}>
								<Share2 />
								{t(($) => $.share.hygienist.button)}
							</Button>
							<div className="relative mt-2 h-2">
								<p
									className={`absolute inset-0 text-green-700 text-xs ${showShareDataConfirmationMessage ? "visible opacity-100" : "invisible opacity-0"}
										`}
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
								<div className="flex flex-col gap-2">
									<span>{t(($) => $.popup.from)}</span>
									<FormField
										control={form.control}
										name="fromDate"
										render={({ field }) => (
											<FormItem>
												<DateInput
													value={field.value}
													onChange={field.onChange}
													placeholder={t(($) => $.popup.startDate)}
													minDate={MIN_DATA_DATE}
													maxDate={MAX_DATA_DATE}
												/>
											</FormItem>
										)}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<span>{t(($) => $.popup.to)}</span>
									<FormField
										control={form.control}
										name="toDate"
										render={({ field }) => (
											<FormItem>
												<DateInput
													value={field.value}
													onChange={field.onChange}
													placeholder={t(($) => $.popup.endDate)}
													minDate={MIN_DATA_DATE}
													maxDate={MAX_DATA_DATE}
												/>
											</FormItem>
										)}
									/>
								</div>
								<div className="relative mt-10">
									<Button type="submit" disabled={!(fromDate && toDate)} className="h-8 text-sm">
										{t(($) => $.popup.deleteData)}
									</Button>

									<div className="absolute bottom-full left-0 mb-2">
										{form.formState.errors.toDate && (
											<div className="text-red-500 text-sm">
												{form.formState.errors.toDate.message}
											</div>
										)}

										{showDeleteText && fromDate && toDate && (
											<div className="text-green-700 text-sm">
												{t(($) => $.popup.dataDeleted, {
													from: format(fromDate, "d MMMM yyyy"),
													to: format(toDate, "d MMMM yyyy"),
												})}
											</div>
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
