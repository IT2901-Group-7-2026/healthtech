import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { createNote, deleteNote, notesQueryOptions, updateNote } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay } from "date-fns";
import { NotebookPenIcon } from "lucide-react";
import { type JSX, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Textarea } from "./ui/textarea";

interface NotesCardProps {
	popUpOverride?: boolean;
}

export const NotesCard = ({ popUpOverride = false }: NotesCardProps) => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { view } = useView();
	const { date } = useDate();
	const queryClient = useQueryClient();
	const { user } = useUser();

	const { data, isLoading, isError, refetch } = useQuery(
		notesQueryOptions({ view: view, selectedDay: date, userId: user.id }),
	);

	const noteForSelectedDate = data?.find((note) => isSameDay(note.time, date, { in: TIMEZONE })) ?? null;

	const { mutate: mutateCreateNote } = useMutation({
		mutationFn: createNote,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			refetch();
		},
	});

	const { mutate: mutateUpdateNote } = useMutation({
		mutationFn: updateNote,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			refetch();
		},
	});

	const { mutate: mutateDeleteNote } = useMutation({
		mutationFn: deleteNote,
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			refetch();
		},
	});

	const [noteValue, setNoteValue] = useState(noteForSelectedDate?.note ?? "");

	const handleBlur = () => {
		const trimmedNoteValue = noteValue.trim();

		if (trimmedNoteValue === "") {
			setNoteValue("");

			if (noteForSelectedDate !== null) {
				mutateDeleteNote({ time: noteForSelectedDate.time, userId: user.id });
			}

			return;
		}

		if (noteForSelectedDate === null) {
			mutateCreateNote({
				note: {
					time: date,
					note: noteValue,
				},
				userId: user.id,
			});
		} else if (noteValue !== noteForSelectedDate.note) {
			mutateUpdateNote({
				note: {
					time: noteForSelectedDate.time,
					note: noteValue,
				},
				userId: user.id,
			});
		}
	};

	useEffect(() => {
		if (data) {
			const foundNote = data.find((note) => isSameDay(note.time, date, { in: TIMEZONE })) ?? null;
			setNoteValue(foundNote?.note ?? "");
		}
	}, [data, date]);

	const formatDate = useFormatDate();

	if (isLoading) {
		return (
			<Card muted={true} className="flex h-24 w-full items-center">
				<p>{t(($) => $.common.loading)}</p>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card muted={true} className="flex h-24 w-full items-center">
				<p>{t(($) => $.common.loading)}</p>
			</Card>
		);
	}

	const isForDayView = view === "day" || popUpOverride;

	let formattedDateLabel = "";
	switch (view) {
		case "day":
			formattedDateLabel = formatDate(date, locale === "en" ? "MMMM do" : "do MMMM");
			break;
		case "week":
			formattedDateLabel = `${t(($) => $.views.week)} ${formatDate(date, "w, yyyy")}`;
			break;
		case "month":
			formattedDateLabel = formatDate(date, "MMMM yyyy");
			break;
	}

	const title = t(($) => $.notes.title, {
		date: formattedDateLabel,
	});

	let Content: JSX.Element;

	if (isForDayView) {
		Content = (
			<Textarea
				placeholder={t(($) => $.notes.placeholder)}
				value={noteValue}
				className="-mx-2 -my-1 min-h-17 w-[calc(100%+var(--spacing)*4)] rounded-t-none border-none bg-transparent px-2 py-1 text-foreground dark:bg-transparent"
				onChange={(e) => setNoteValue(e.target.value)}
				onBlur={handleBlur}
			/>
		);
	} else {
		Content =
			data && data.length > 0 ? (
				<ul>
					{data.map((note) => (
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
			) : (
				<p className="text-sm">
					{t(($) => $.notes.noNotes, {
						view: t(($$) => $$.views[view]),
					})}
				</p>
			);
	}

	return (
		<Card muted={true} className="max-h-96 w-full gap-0 overflow-y-auto p-0">
			<CardHeader className="rounded-t-xl bg-secondary px-3 py-2 pb-0">
				<div className="flex items-center gap-2">
					<NotebookPenIcon className="size-3.5 text-muted-foreground" />
					<h2 className="text-muted-foreground text-xs uppercase tracking-wider">{title}</h2>
				</div>
			</CardHeader>
			<CardContent className="rounded-t-none p-3 py-2">{Content}</CardContent>
		</Card>
	);
};
