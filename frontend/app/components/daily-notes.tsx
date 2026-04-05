/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <I prefer this over sending functions as props> */

import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { createNote, notesQueryOptions, updateNote } from "@/lib/api";
import type { Note } from "@/lib/dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay, isSameMonth, isSameWeek } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Textarea } from "./ui/textarea";

export const DailyNotes = ({ popUpOverride = false }: { popUpOverride?: boolean }) => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { view } = useView();
	const { date } = useDate();
	const queryClient = useQueryClient();
	const { user } = useUser();

	const { data, isLoading, isError, refetch } = useQuery(
		notesQueryOptions({ view: view, selectedDay: date, userId: user.id }),
	);

	const { mutate: mutateUpdateNote } = useMutation({
		mutationFn: updateNote,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			refetch();
		},
	});

	const { mutate: mutateCreateNote } = useMutation({
		mutationFn: createNote,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			refetch();
		},
	});

	const [todayNote, setTodayNote] = useState<Note | null>(
		data ? (data.find((note) => isSameDay(note.time, date, { in: TIMEZONE })) ?? null) : null,
	);

	const [showTextArea, setShowTextArea] = useState<boolean>(
		data ? !data.some((note) => isSameDay(note.time, date, { in: TIMEZONE })) : true,
	);

	const handleEdit = () => {
		setShowTextArea(!showTextArea);
	};

	const handleSubmit = () => {
		if (todayNote !== null && todayNote.note !== "" && data) {
			if (data.some((note) => isSameDay(note.time, date, { in: TIMEZONE }))) {
				mutateUpdateNote({ note: todayNote, userId: user.id });
			} else {
				mutateCreateNote({ note: todayNote, userId: user.id });
			}
		}
		setShowTextArea(false);
	};

	useEffect(() => {
		if (data) {
			const foundNote = data.find((note) => isSameDay(note.time, date, { in: TIMEZONE })) ?? null;
			setTodayNote(foundNote);
			setShowTextArea(!foundNote);
		}
	}, [data, date]);

	const formatDate = useFormatDate();

	if (isLoading) {
		return (
			<Card muted={true} className="flex h-24 w-full items-center">
				<p>{t(($) => $.loadingData)}</p>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card muted={true} className="flex h-24 w-full items-center">
				<p>{t(($) => $.loadingData)}</p>
			</Card>
		);
	}

	if (view === "day" || popUpOverride) {
		return (
			<Card muted={true} className="max-h-96 w-full overflow-y-auto">
				<CardHeader>
					<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
						{t(($) => $.daily_notes.dayTitle, {
							day: formatDate(date, locale === "en" ? "MMMM do" : "do MMMM"),
						})}
					</h2>
				</CardHeader>
				<CardContent>
					{showTextArea ? (
						<Textarea
							placeholder={t(($) => $.daily_notes.writeHere)}
							value={todayNote?.note ?? ""}
							className="min-h-15"
							onChange={(e) =>
								setTodayNote({
									time: date,
									note: e.target.value,
								})
							}
						/>
					) : (
						<p>
							{
								data?.find((note) =>
									isSameDay(note.time, date, {
										in: TIMEZONE,
									}),
								)?.note
							}
						</p>
					)}
				</CardContent>
				<CardFooter className="justify-end gap-2">
					{todayNote !== null && !showTextArea && (
						<Button size="sm" variant={"secondary"} onClick={handleEdit}>
							{t(($) => $.daily_notes.edit)}
						</Button>
					)}
					{showTextArea && (
						<Button
							size="sm"
							disabled={todayNote === null || todayNote.note.trim() === ""}
							onClick={handleSubmit}
						>
							{t(($) => $.daily_notes.save)}
						</Button>
					)}
				</CardFooter>
			</Card>
		);
	}

	if (view === "week") {
		return (
			<Card muted={true} className="max-h-96 w-full overflow-y-auto">
				<CardHeader>
					<h2 className="text-xl">
						{t(($) => $.daily_notes.notesFromThis)}
						<strong>{t(($) => $.daily_notes.week)}</strong>
						{":"}
					</h2>
				</CardHeader>
				<CardContent>
					<ul>
						{data
							? data
									.filter((note) =>
										isSameWeek(date, note.time, {
											in: TIMEZONE,
											weekStartsOn: 1,
										}),
									)
									.sort((n1, n2) => n1.time.getTime() - n2.time.getTime())
									.map((note) => (
										<li key={note.time.toDateString()}>
											<strong>
												{note.time.toLocaleDateString(locale, {
													day: "numeric",
													month: "long",
												})}
												{": "}
											</strong>
											{note.note}
										</li>
									))
							: null}
					</ul>
				</CardContent>
			</Card>
		);
	}

	//month-view
	return (
		<Card muted={true} className="max-h-96 w-full overflow-y-auto">
			<CardHeader>
				<h2 className="text-xl">
					{t(($) => $.daily_notes.notesFromThis)}
					<strong>{t(($) => $.daily_notes.month)}</strong>
					{":"}
				</h2>
			</CardHeader>
			<CardContent>
				<ul>
					{data
						? data
								.filter((note) =>
									isSameMonth(date, note.time, {
										in: TIMEZONE,
									}),
								)
								.sort((n1, n2) => n1.time.getTime() - n2.time.getTime())
								.map((note) => (
									<li key={note.time.getTime()}>
										<strong>
											{note.time.toLocaleDateString(locale, {
												day: "numeric",
												month: "long",
											})}
											{": "}
										</strong>
										{note.note}
									</li>
								))
						: null}
				</ul>
			</CardContent>
		</Card>
	);
};
