import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { useFormatDate } from "@/hooks/use-format-date";
import { now } from "@/lib/date";
import type { User } from "@/lib/dto.js";
import { TZDate } from "@date-fns/tz";
import { isBefore } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BasePopup } from "./base-popup";

interface PrivacySettingsPopupProps {
	user: User;
	avatarSrc: string;
	open: boolean;
	onClose: () => void;
	users?: Array<User>;
	setUser?: (user: User) => void;
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

	const onSubmit = (data: DateFormValues) => {
		if (data.fromDate && data.toDate && isBefore(data.toDate, data.fromDate)) {
			form.setError("toDate", {
				message: t(($) => $.popup.invalidDate),
			});

			setTimeout(() => {
				form.clearErrors("toDate");
			}, 5000);
			return;
		}

		setDeleteText(true);

		setTimeout(() => {
			setDeleteText(false);
		}, 5000);
	};

	// We chose the minimum date to be the 1st of January 2024 because there is no data before this date
	const minSelectableDate = new TZDate(2024, 0, 1, "Europe/Oslo");
	const maxSelectableDate = now();

	const [deleteText, setDeleteText] = useState(false);
	const [showShareDataConfirmationMessage, setShowShareDataConfirmationMessage] = useState(false);

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="flex flex-col gap-3 text-sm md:px-0 md:pb-1">
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.share.hygienist.button)}</p>
					<Card className="p-3">
						<div>
							<Button
								className=""
								variant="outline"
								onClick={() => {
									setShowShareDataConfirmationMessage(true);

									setTimeout(() => {
										setShowShareDataConfirmationMessage(false);
									}, 5000);
								}}
							>
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
							<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-2">
								{/* From */}
								<div className="flex flex-col gap-2">
									<span>{t(($) => $.popup.from)}</span>
									<FormField
										control={form.control}
										name="fromDate"
										render={({ field }) => (
											<FormItem>
												{/* NOTE: we forward the field’s value & onChange */}
												<DateInput
													value={field.value}
													onChange={field.onChange}
													placeholder={t(($) => $.popup.startDate)}
													minDate={minSelectableDate}
													maxDate={maxSelectableDate}
												/>
											</FormItem>
										)}
									/>
								</div>

								{/* To */}
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
													minDate={minSelectableDate}
													maxDate={maxSelectableDate}
												/>
											</FormItem>
										)}
									/>
								</div>

								{/* Button + floating message */}
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

										{deleteText && fromDate && toDate && (
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
