import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormatDate } from "@/hooks/use-format-date";
import { now, toTZDate } from "@/lib/date";
import type { User } from "@/lib/dto.js";
import { userRoleToString } from "@/lib/utils.js";
import { TZDate } from "@date-fns/tz";
import { isBefore } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BasePopup } from "./base-popup";

interface ProfilePopupProps {
	user: User;
	avatarSrc: string;
	open: boolean;
	onClose: () => void;
	users?: Array<User>;
	setUser?: (user: User) => void;
	children?: React.ReactNode;
}

export function ProfilePopup({ user, open, onClose, avatarSrc, children }: ProfilePopupProps) {
	const { t } = useTranslation();
	const title = t(($) => $.profile.title);

	const tempListOfRegulations = ["Safety boots", "Helmet", "Protective mask"];
	type FormValues = {
		fromDate?: TZDate;
		toDate?: TZDate;
	};

	const form = useForm<FormValues>({
		defaultValues: {
			fromDate: undefined,
			toDate: undefined,
		},
		mode: "onChange",
	});

	const fromDate = form.watch("fromDate");
	const toDate = form.watch("toDate");
	const format = useFormatDate();

	const onSubmit = (data: FormValues) => {
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

	const minSelectableDate = new TZDate(2024, 0, 1, "Europe/Oslo");
	const maxSelectableDate = now();

	const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
	const [toCalendarOpen, setToCalendarOpen] = useState(false);
	const [deleteText, setDeleteText] = useState(false);

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="flex flex-col gap-3 text-sm md:px-0 md:pb-1">
				<div className="flex flex-row items-center gap-4">
					<div>
						{avatarSrc ? (
							<img
								src={avatarSrc}
								height={100}
								width={100}
								alt={user.username}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<div className="h-20 w-20 rounded-full bg-blue-900"></div>
						)}
					</div>
					<div className="flex w-full flex-col">
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">{t(($) => $.profile.name)}</p>
							<h2>{user.username}</h2>
						</div>
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">{t(($) => $.profile.location)}</p>
							<h3>{user.location.site}</h3>
						</div>
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">{t(($) => $.profile.jobTitle)}</p>
							<h3>{userRoleToString(user.role, t)}</h3>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h4 className="text-muted-foreground">{t(($) => $.profile.secReg)}</h4>
					<div className="w-full rounded-lg bg-card-highlight p-2">
						<ul className="ml-5 list-disc">
							{tempListOfRegulations.map((reg) => (
								<li key={reg}>{reg}</li>
							))}
						</ul>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.profile.jobDescription)}</p>
					<div className="w-full rounded-lg bg-card-highlight p-2">
						<p>{user.jobDescription}</p>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">{t(($) => $.profile.deleteButtonInformation)}</p>
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
												<Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
													<PopoverTrigger asChild={true}>
														<Button
															variant="outline"
															className="h-8 w-32 justify-between text-sm"
														>
															{fromDate
																? format(fromDate, "dd.MM.yy")
																: t(($) => $.popup.startDate)}
															<ChevronDownIcon />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={(value) =>
																field.onChange(value ? toTZDate(value) : undefined)
															}
															disabled={{
																before: minSelectableDate,
																after: maxSelectableDate,
															}}
														/>
													</PopoverContent>
												</Popover>
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
												<Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
													<PopoverTrigger asChild={true}>
														<Button
															variant="outline"
															className="h-8 w-32 justify-between text-sm"
														>
															{toDate
																? format(toDate, "dd.MM.yy")
																: t(($) => $.popup.endDate)}
															<ChevronDownIcon />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={(value) =>
																field.onChange(value ? toTZDate(value) : undefined)
															}
															disabled={{
																before: minSelectableDate,
																after: maxSelectableDate,
															}}
														/>
													</PopoverContent>
												</Popover>
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
												{t(($) => $.popup.dataDeleted)} {format(fromDate, "d MMMM yyyy")}{" "}
												{"to "}
												{format(toDate, "d MMMM yyyy")}
												{"."}
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
