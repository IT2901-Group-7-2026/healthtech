import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormatDate } from "@/hooks/use-format-date";
import { now } from "@/lib/date";
import { TZDate } from "@date-fns/tz";
import { format, isBefore } from "date-fns";
import { CalendarIcon, Share2, Trash2 } from "lucide-react";
import { useCallback, useId, useState } from "react"; // ← added useId
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
	const datePickerId = useId();

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
	const tzToPlain = (tz?: TZDate) => (tz ? new Date(tz.getTime()) : undefined);
	const plainToTz = (plain?: Date) => (plain ? new TZDate(plain, "Europe/Oslo") : undefined);

	const displayFrom = fromDate ? tzToPlain(fromDate) : undefined;
	const displayTo = toDate ? tzToPlain(toDate) : undefined;

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
									<Popover>
										<PopoverTrigger asChild={true}>
											<Button
												variant="outline"
												id={datePickerId}
												className="justify-start px-2.5 font-normal"
											>
												<CalendarIcon />
												{displayFrom ? (
													displayTo ? (
														<>
															{format(displayFrom, "LLL dd, y")}
															<span className="mx-1">{"-"}</span>
															{format(displayTo, "LLL dd, y")}
														</>
													) : (
														format(displayFrom, "LLL dd, y")
													)
												) : (
													<span>{t(($) => $.popup.pickDate)}</span>
												)}
											</Button>
										</PopoverTrigger>

										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="range"
												selected={{
													from: displayFrom,
													to: displayTo,
												}}
												onSelect={(range) => {
													form.setValue("fromDate", plainToTz(range?.from));
													form.setValue("toDate", plainToTz(range?.to));
												}}
												defaultMonth={displayFrom ?? new Date()}
												numberOfMonths={2}
												disabled={(date) => {
													const time = date.getTime();
													return (
														time < MIN_DATA_DATE.getTime() || time > MAX_DATA_DATE.getTime()
													);
												}}
											/>
										</PopoverContent>
									</Popover>
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
