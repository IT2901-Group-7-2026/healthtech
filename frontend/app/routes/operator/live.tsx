import { DailyNotes } from "@/components/daily-notes";

export default function OperatorLiveView() {
	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex w-1/5 shrink-0 flex-col gap-4">
				<DailyNotes />
			</div>

			<div className="flex w-full min-w-0 flex-col gap-4"></div>
		</div>
	);
}
