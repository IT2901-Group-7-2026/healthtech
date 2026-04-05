import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { createNote, notesQueryOptions, updateNote } from "@/lib/api";
import type { Note } from "@/lib/dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay } from "date-fns";
import { type JSX, useEffect, useState } from "react";
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

	const isForDayView = view === "day" || popUpOverride;

	let titleFormattedDate = "";
	switch (view) {
		case "day":
			titleFormattedDate = formatDate(date, locale === "en" ? "MMMM do" : "do MMMM");
			break;
		case "week":
			titleFormattedDate = `${t(($) => $.week)} ${formatDate(date, "w, yyyy")}`;
			break;
		case "month":
			titleFormattedDate = formatDate(date, "MMMM yyyy");
			break;
	}

	const title = t(($) => $.daily_notes.viewTitle, {
		view: titleFormattedDate,
	});

	let Content: JSX.Element;

	if (isForDayView) {
		Content =
			isForDayView && showTextArea ? (
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
			);
	} else {
		Content = (
			<ul>
				{data?.map((note) => (
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
				))}
			</ul>
		);
	}

	return (
		<Card muted={true} className="max-h-96 w-full overflow-y-auto">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">{title}</h2>
			</CardHeader>
			<CardContent>{Content}</CardContent>
			{isForDayView && (
				<CardFooter className="justify-end gap-2">
					{todayNote !== null && !showTextArea && (
						<Button size="sm" variant="secondary" onClick={handleEdit}>
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
			)}
		</Card>
	);
};
