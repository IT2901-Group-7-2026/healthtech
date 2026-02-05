/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <I prefer this over sending functions as props> */
import { useDate } from "@/features/date-picker/use-date";
import { useView } from "@/features/views/use-view";
import { createNote, notesQueryOptions, updateNote } from "@/lib/api";
import type { Note } from "@/lib/dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay, isSameMonth, isSameWeek } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useUser } from "@/features/user/user-user";

export const DailyNotes = ({
	popUpOverride = false,
}: {
	popUpOverride?: boolean;}) => {
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
		data ? (data.find((note) => isSameDay(note.time, date)) ?? null) : null,
	);

	const [showTextArea, setShowTextArea] = useState<boolean>(
		data ? !data.some((note) => isSameDay(note.time, date)) : true,
	);

	const handleEdit = () => {
		setShowTextArea(!showTextArea);
	};

	const handleSubmit = () => {
		if (todayNote !== null && todayNote.note !== "" && data) {
			if (data.some((note) => isSameDay(note.time, date))) {
				mutateUpdateNote({ note: todayNote, userId: user.id });
			} else {
				mutateCreateNote({ note: todayNote, userId: user.id });
			}
		}
		setShowTextArea(false);
	};

	useEffect(() => {
		if (data) {
			const foundNote = data.find((note) => isSameDay(note.time, date)) ?? null;
			setTodayNote(foundNote);
			setShowTextArea(!foundNote);
		}
	}, [data, date]);

	if (isLoading) {
		return (
			<Card className="flex h-24 w-full items-center">
				<p>{t(($) => $.loadingData)}</p>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="flex h-24 w-full items-center">
				<p>{t(($) => $.loadingData)}</p>
			</Card>
		);
	}

	if (view === "day" || popUpOverride) {
		return (
			<Card className="max-h-96 w-full overflow-y-auto">
				<CardHeader>
					<h2 className="text-xl">{t(($) => $.daily_notes.dayTitle)}</h2>
					<p>
						{t(($) => $.daily_notes.daySubtitle, {
							day: date.toLocaleDateString(locale, {
								day: "numeric",
								month: "long",
							}),
						})}
					</p>
				</CardHeader>
				<CardContent>
					{showTextArea ? (
						<Textarea
							placeholder={t(($) => $.daily_notes.writeHere)}
							value={todayNote ? todayNote.note : ""}
							onChange={(e) =>
								setTodayNote({ time: date, note: e.target.value })
							}
						/>
					) : (
						<p>{data?.find((note) => isSameDay(note.time, date))?.note}</p>
					)}
				</CardContent>
				<CardFooter className="justify-end gap-2">
					<Button variant={"secondary"} onClick={handleEdit}>
						{t(($) => $.daily_notes.edit)}
					</Button>
					<Button disabled={!showTextArea} onClick={handleSubmit}>
						{t(($) => $.daily_notes.save)}
					</Button>
				</CardFooter>
			</Card>
		);
	}

	if (view === "week") {
		return (
			<Card className="max-h-96 w-full overflow-y-auto">
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
										isSameWeek(date, note.time, { weekStartsOn: 1 }),
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
		<Card className="max-h-96 w-full overflow-y-auto">
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
								.filter((note) => isSameMonth(date, note.time))
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
