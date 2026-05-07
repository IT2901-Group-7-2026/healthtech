import { tzDateSchema } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import { z } from "zod";

export const NoteSchema = z.object({
	note: z.string(),
	time: tzDateSchema,
});

export type Note = z.infer<typeof NoteSchema>;

export type NoteDataRequest = {
	startTime: TZDate;
	endTime: TZDate;
};
