import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BasePopup } from "@/features/popups/base-popup";
import { useFormatDate } from "@/hooks/use-format-date";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import { parseAsTZDate, today } from "@/lib/date";
import type { UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor } from "@/lib/sensors";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const getExposureBadges = (worker: UserWithStatusDto, popupStatus: DangerLevel) => {
	const exposures = [
		{ key: "noise", data: worker.status.noise },
		{ key: "dust", data: worker.status.dust },
		{ key: "vibration", data: worker.status.vibration },
	];

	return exposures.filter(({ data }) => {
		if (!data) return false;

		if (popupStatus === "danger") {
			return data.dangerLevel === "danger";
		}

		if (popupStatus === "warning") {
			return data.dangerLevel === "warning" || data.dangerLevel === "danger";
		}

		return false;
	});
};

const WorkerRow = ({
	worker,
	status,
	to,
	onNavigate,
}: {
	worker: UserWithStatusDto;
	status: DangerLevel;
	to: string;
	onNavigate: () => void;
}) => {
	const exposureBadges = getExposureBadges(worker, status).map(({ key, data }) => (
		<span
			key={key}
			className={`rounded-md px-2 py-0.5 font-medium text-white text-xs bg-${mapDangerLevelToColor(
				data?.dangerLevel ?? "safe",
			)}`}
		>
			{key}
		</span>
	));

	return (
		<TableRow key={worker.id}>
			<TableCell>
				<Link to={to} onClick={onNavigate} className="flex w-full items-center justify-between">
					<div className="flex items-center gap-5">
						<div className={`size-3 rounded-sm bg-${mapDangerLevelToColor(worker.status.status)}`} />
						<p>{worker.username}</p>
					</div>

					<div className="flex gap-2">{exposureBadges}</div>
				</Link>
			</TableCell>
		</TableRow>
	);
};

export function AtRiskPopup({
	status,
	open,
	onClose,
	subordinates,
}: {
	title: string;
	status: DangerLevel;
	open: boolean;
	onClose: () => void;
	subordinates: Array<UserWithStatusDto>;
}) {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const [sensor] = useQueryState("sensor", parseAsSensor);
	const [date] = useQueryState("filterDate", parseAsTZDate.withDefault(today()));
	const [, setSelectedUserId] = useQueryState("userId", parseAsString);

	const exposureTitle =
		status === "danger"
			? t((x) => x.exposureLevel.in_danger)
			: status === "warning"
				? t((x) => x.exposureLevel.warning)
				: t((x) => x.exposureLevel.safe);

	const workers = subordinates.filter((sub) => sub.status.status === status);

	const emptyTableBody = (
		<TableRow>
			<TableCell className="text-center text-zinc-500">{t((x) => x.exposureLevel.no_in_danger)}</TableCell>
		</TableRow>
	);

	const tableBody =
		workers.length === 0
			? emptyTableBody
			: workers.map((worker) => {
					const params = new URLSearchParams();
					params.set("userId", worker.id);

					if (sensor) {
						params.set("sensor", sensor);
					}

					if (date) {
						params.set("filterDate", formatDate(date, "yyyy-MM-dd"));
					}

					return (
						<WorkerRow
							key={worker.id}
							worker={worker}
							status={status}
							to={`/foreman/?${params.toString()}`}
							onNavigate={() => {
								setSelectedUserId(worker.id);
								onClose();
							}}
						/>
					);
				});

	return (
		<BasePopup title={exposureTitle} open={open} relevantDate={null} onClose={onClose}>
			<Card hoverable={true}>
				<CardContent>
					<Table>
						<TableBody>{tableBody}</TableBody>
					</Table>
				</CardContent>
			</Card>
		</BasePopup>
	);
}
