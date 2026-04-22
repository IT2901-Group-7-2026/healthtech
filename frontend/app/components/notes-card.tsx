import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { createNote, deleteNote, notesQueryOptions, updateNote } from "@/lib/api";
import { buildNotesQueryKeyPrefix } from "@/lib/query-key-builder";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay } from "date-fns";
import { NotebookPenIcon } from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton.js";
import { Textarea } from "./ui/textarea";

interface NotesCardProps {
	forceInteractiveMode?: boolean;
}

export const NotesCard = ({ forceInteractiveMode = false }: NotesCardProps) => {
	const { t, i18n } = useTranslation();
	const { view } = useView();
	const { date } = useDate();
	const { pathname, search } = useLocation();
	const queryClient = useQueryClient();
	const { user } = useUser();
	const formatDate = useFormatDate();

	const canLinkToDayView = pathname !== "/operator/live";

	const { data, isLoading, isError, refetch } = useQuery(
		notesQueryOptions({ view: view, selectedDay: date, userId: user.id }),
	);

	const { mutate: mutateCreateNote } = useMutation({
		mutationFn: createNote,
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: buildNotesQueryKeyPrefix(user.id),
			});
			refetch();
		},
	});

	const { mutate: mutateUpdateNote } = useMutation({
		mutationFn: updateNote,
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: buildNotesQueryKeyPrefix(user.id),
			});
			refetch();
		},
	});

	const { mutate: mutateDeleteNote } = useMutation({
		mutationFn: deleteNote,
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: buildNotesQueryKeyPrefix(user.id),
			});
			refetch();
		},
	});

	const noteForSelectedDate = data?.find((note) => isSameDay(note.time, date, { in: TIMEZONE })) ?? null;
	const [noteValue, setNoteValue] = useState(noteForSelectedDate?.note ?? "");

	const handleBlur = () => {
		const trimmedNoteValue = noteValue.trim();

		if (trimmedNoteValue === "") {
			setNoteValue("");

			if (noteForSelectedDate !== null) {
				mutateDeleteNote({
					time: noteForSelectedDate.time,
					userId: user.id,
				});
			}

			return;
		}

		if (noteForSelectedDate === null) {
			mutateCreateNote({
				note: {
					time: date,
					note: trimmedNoteValue,
				},
				userId: user.id,
			});
		} else if (trimmedNoteValue !== noteForSelectedDate.note) {
			mutateUpdateNote({
				note: {
					time: noteForSelectedDate.time,
					note: trimmedNoteValue,
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

	const isInteractiveMode = forceInteractiveMode || view === "day";
	const title = t(($) => $.notes[isInteractiveMode ? "interactive" : "list"].title);

	if (isLoading) {
		return (
			<CustomCard title={title}>
				<Skeleton className="h-4 w-[90%]" />
				<Skeleton className="h-4 w-1/2" />
			</CustomCard>
		);
	}

	if (isError) {
		return (
			<CustomCard title={title}>
				<p>{t(($) => $.common.error)}</p>
			</CustomCard>
		);
	}

	if (isInteractiveMode) {
		return (
			<CustomCard title={title}>
				<Textarea
					placeholder={t(($) => $.notes.interactive.placeholder)}
					value={noteValue}
					className="-mx-2 -my-1 min-h-17 w-[calc(100%+var(--spacing)*4)] rounded-t-none border-none bg-transparent px-2 py-1 text-foreground dark:bg-transparent"
					onChange={(e) => setNoteValue(e.target.value)}
					onBlur={handleBlur}
				/>
			</CustomCard>
		);
	}

	if (!data || data.length === 0) {
		return (
			<CustomCard title={title}>
				<p className="text-sm">
					{t(($) => $.notes.list.noNotes, {
						view: t(($$) => $$.views[view]),
					})}
				</p>
			</CustomCard>
		);
	}

	return (
		<CustomCard title={title}>
			<div className="grid grid-cols-[max-content_1fr] gap-y-1">
				{data.map((note) => {
					const rowContent = (
						<>
							<p
								className={cn(
									"col-start-1 w-fit shrink-0",
									"rounded-md bg-secondary p-px px-0.5",
									"truncate font-semibold text-[0.675rem] tabular-nums",
								)}
							>
								{formatDate(note.time, i18n.language === "en" ? "MMM d" : "d. MMM")}
							</p>
							<p className="col-start-2 min-w-0 truncate text-xs">{note.note}</p>
						</>
					);

					const rowClassName = cn(
						"col-span-2 grid min-w-0 grid-cols-subgrid gap-x-1.5",
						"-mx-1 items-baseline rounded-lg p-1 transition-colors",
					);

					if (!canLinkToDayView) {
						return (
							<div key={note.time.getTime()} title={note.note} className={rowClassName}>
								{rowContent}
							</div>
						);
					}

					const params = new URLSearchParams(search);
					params.set("view", "day");
					params.set("date", formatDate(note.time, "yyyy-MM-dd"));

					return (
						<Link
							key={note.time.getTime()}
							title={note.note}
							to={{
								pathname,
								search: `?${params.toString()}`,
							}}
							prefetch="intent"
							className={cn("hover:bg-card-highlight", rowClassName)}
						>
							{rowContent}
						</Link>
					);
				})}
			</div>
		</CustomCard>
	);
};

interface CustomCardProps extends PropsWithChildren {
	title: string;
}

function CustomCard({ title, children }: CustomCardProps) {
	return (
		<Card muted={true} className="max-h-96 w-full gap-0 overflow-y-auto p-0">
			<CardHeader className="rounded-t-xl bg-secondary px-3 py-2 pb-0">
				<div className="flex items-center gap-2">
					<NotebookPenIcon className="size-3.5 text-muted-foreground" />
					<h2 className="text-muted-foreground text-xs uppercase tracking-wider">{title}</h2>
				</div>
			</CardHeader>
			<CardContent className="rounded-t-none p-3 py-2">{children}</CardContent>
		</Card>
	);
}
