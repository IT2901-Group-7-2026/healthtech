import { Card, CardContent, CardFooter } from "@/components/ui/card.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@/components/ui/table.tsx";
import { BasePopup } from "@/features/popups/base-popup.tsx";
import {
	type DangerLevel,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.ts";
import { type UserWithStatusDto } from "@/lib/dto.ts";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

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
		if (!data) {
			return false;
		}

		if (popupStatus === "danger") {
			return data.dangerLevel === "danger";
		}

		if (popupStatus === "warning") {
			return (
				data.dangerLevel === "warning" || data.dangerLevel === "danger"
			);
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
	subordinates,
}: {
	title: string;
	status: DangerLevel;
	open: boolean;
	onClose: () => void;
	subordinates: Array<UserWithStatusDto>;
}) {
	const { t } = useTranslation();

	const exposureTitle =
		status === "danger"
			? t((x) => x.exposureLevel.in_danger)
			: status === "warning"
				? t((x) => x.exposureLevel.warning)
				: t((x) => x.exposureLevel.safe);

	const workers = subordinates.filter((sub) => sub.status.status === status);

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
					<WorkerRow
						key={worker.id}
						worker={worker}
						status={status}
					/>
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
				<Card hoverable>
					<CardContent>
						<Table>
							<TableBody>{tableBody}</TableBody>
						</Table>
					</CardContent>

					<CardFooter className="gap-1 text-muted-foreground text-xs">
						<p>{t(($) => $.atRiskTable.detailText)}</p>
						<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
					</CardFooter>
				</Card>
			</Link>
		</BasePopup>
	);
}
