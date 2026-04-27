import { ExposureBadge } from "@/components/exposure-badge";
import { DataTable } from "@/components/ui/data-table";
import { type DangerLevel, mapDangerLevelToLabel } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import type { Exposure } from "@/lib/exposures";
import type { ColumnDef } from "@tanstack/react-table";
import { t } from "i18next";

export interface ExposureTableCellProps {
	data: Array<UserWithStatusDto> | undefined;
	setSelectedUserId: (userId: string) => void;
	setExposure: (exposure: string) => void;
}

export function OperatorExposureStatusTable({ data, setSelectedUserId, setExposure }: ExposureTableCellProps) {
	const columns: Array<ColumnDef<UserWithStatusDto>> = [
		{
			id: "name",
			accessorKey: "name",
			header: t(($) => $.foremanDashboard.team.table.name),
			cell: ({ row }) => (
				<button
					type="button"
					className="cursor-pointer font-medium hover:underline"
					onClick={() => setSelectedUserId(row.original.id)}
				>
					{row.original.name}
				</button>
			),
		},
		{
			id: "dust",
			header: t(($) => $.exposures.dust),
			cell: ({ row }) => {
				const status = row.original.status.dust?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusExposureCell
						status={status}
						exposure="dust"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setExposure("dust");
						}}
					/>
				);
			},
		},
		{
			id: "noise",
			header: t(($) => $.exposures.noise),
			cell: ({ row }) => {
				const status = row.original.status.noise?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusExposureCell
						status={status}
						exposure="noise"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setExposure("noise");
						}}
					/>
				);
			},
		},
		{
			id: "vibration",
			header: t(($) => $.exposures.vibration),
			cell: ({ row }) => {
				const status = row.original.status.vibration?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusExposureCell
						status={status}
						exposure="vibration"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setExposure("vibration");
						}}
					/>
				);
			},
		},
	];

	return <DataTable columns={columns} data={data ?? []} getRowId={(teamMember) => teamMember.id} />;
}

interface OperatorExposureStatusCellProps {
	onClick?: () => void;
	status: DangerLevel;
	exposure: Exposure;
}

function OperatorExposureStatusExposureCell({ onClick, status, exposure }: OperatorExposureStatusCellProps) {
	const label = mapDangerLevelToLabel(status);

	return (
		<button type="button" className="w-fit cursor-pointer" onClick={onClick}>
			<ExposureBadge exposure={exposure} dangerLevel={status}>
				{label}
			</ExposureBadge>
		</button>
	);
}
