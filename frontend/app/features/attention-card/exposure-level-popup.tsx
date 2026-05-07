import { ExposureBadge } from "@/components/exposure-badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BasePopup } from "@/features/popups/base-popup";
import type { DangerLevel } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto/user";
import { exposures } from "@/lib/exposures.js";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const getExposureBadges = (worker: UserWithStatusDto, popupStatus: DangerLevel) => {
	const entries = exposures.map((exposure) => ({
		exposure,
		data: worker.status[exposure],
	}));

	return entries.filter(({ data }) => {
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

const WorkerRow = ({ worker, status }: { worker: UserWithStatusDto; status: DangerLevel }) => {
	const { t } = useTranslation();

	const exposureBadges = getExposureBadges(worker, status).map(({ exposure, data }) => (
		<ExposureBadge key={exposure} exposure={exposure} dangerLevel={data?.dangerLevel ?? "safe"}>
			{t(($) => $.exposures[exposure])}
		</ExposureBadge>
	));

	return (
		<TableRow key={worker.id}>
			<TableCell>
				<Link to={`/foreman/?userId=${worker.id}`} className="flex w-full items-center justify-between">
					<p>{worker.name}</p>
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
			? t((x) => x.exposureLevel.inDanger)
			: status === "warning"
				? t((x) => x.exposureLevel.warning)
				: t((x) => x.exposureLevel.safe);

	const workers = subordinates.filter((sub) => sub.status.status === status);

	const emptyTableBody = (
		<TableRow>
			<TableCell className="text-center text-zinc-500">{t((x) => x.exposureLevel.noInDanger)}</TableCell>
		</TableRow>
	);

	const tableBody =
		workers.length === 0
			? emptyTableBody
			: workers.map((worker) => <WorkerRow key={worker.id} worker={worker} status={status} />);

	return (
		<BasePopup title={exposureTitle} open={open} relevantDate={null} onClose={onClose}>
			<Table>
				<TableBody>{tableBody}</TableBody>
			</Table>
		</BasePopup>
	);
}
