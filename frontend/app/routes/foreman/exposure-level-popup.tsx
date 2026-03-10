import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BasePopup } from "@/features/popups/base-popup";
import { useUser } from "@/features/user/user-context";
import { fetchSubordinatesQueryOptions } from "@/lib/api.js";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto.js";

const getExposureBadges = (
	worker: UserWithStatusDto,
	popupStatus: DangerLevel,
) => {
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
}: {
	worker: UserWithStatusDto;
	status: DangerLevel;
}) => {
	const exposureBadges = getExposureBadges(worker, status).map(
		({ key, data }) => (
			<span
				key={key}
				className={`rounded-md px-2 py-0.5 font-medium text-white text-xs bg-${mapDangerLevelToColor(
					data?.dangerLevel ?? "safe",
				)}`}
			>
				{key}
			</span>
		),
	);

	return (
		<TableRow key={worker.id}>
			<TableCell>
				<Link
					//TODO: change routing to the subs individual page
					to={`/foreman/team/`}
					className="flex w-full items-center justify-between"
				>
					<div className="flex items-center gap-5">
						<div
							className={`size-3 rounded-sm bg-${mapDangerLevelToColor(
								worker.status.status,
							)}`}
						/>
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
}: {
	title: string;
	status: DangerLevel;
	open: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const { user } = useUser();
	const { data: subordinates = [] } = useQuery(
		fetchSubordinatesQueryOptions(user.id),
	);

	const exposureTitle =
		status === "danger"
			? t((x) => x.exposureLevel.in_danger)
			: status === "warning"
				? t((x) => x.exposureLevel.warning)
				: t((x) => x.exposureLevel.safe);

	const workers =
		status === "safe"
			? subordinates.filter((sub) => sub.status.status === "safe")
			: subordinates.filter((sub) => sub.status.status === status);

	const emptyTableBody = (
		<TableRow>
			<TableCell className="text-center text-zinc-500">
				{t((x) => x.exposureLevel.no_in_danger)}
			</TableCell>
		</TableRow>
	);

	const tableBody =
		workers.length === 0
			? emptyTableBody
			: workers.map((worker) => (
					<WorkerRow key={worker.id} worker={worker} status={status} />
				));

	return (
		<BasePopup
			title={exposureTitle}
			open={open}
			relevantDate={null}
			onClose={onClose}
		>
			<Link
				to={`/foreman/team/`}
				className="h-full w-full flex-1 basis-4 rounded-2xl"
			>
				<Card className="p-4">
					<CardContent>
						<Table>
							<TableBody>{tableBody}</TableBody>
						</Table>
					</CardContent>

					<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
						<p>{t((x) => x.atRiskTable.detailText)}</p>
						<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
					</div>
				</Card>
			</Link>
		</BasePopup>
	);
}
