import { ExposureBadge } from "@/components/exposure-badge";
import { DataTable } from "@/components/ui/data-table";
import { type DangerLevel, mapDangerLevelToLabel } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import type { ColumnDef } from "@tanstack/react-table";
import { t } from "i18next";

export interface SensorTableCellProps {
	data: Array<UserWithStatusDto> | undefined;
	setSelectedUserId: (userId: string) => void;
	setSensor: (sensor: string) => void;
}

export function OperatorExposureStatusTable({ data, setSelectedUserId, setSensor }: SensorTableCellProps) {
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
			header: t(($) => $.sensors.dust),
			cell: ({ row }) => {
				const status = row.original.status.dust?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusSensorCell
						status={status}
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("dust");
						}}
					/>
				);
			},
		},
		{
			id: "noise",
			header: t(($) => $.sensors.noise),
			cell: ({ row }) => {
				const status = row.original.status.noise?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusSensorCell
						status={status}
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("noise");
						}}
					/>
				);
			},
		},
		{
			id: "vibration",
			header: t(($) => $.sensors.vibration),
			cell: ({ row }) => {
				const status = row.original.status.vibration?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusSensorCell
						status={status}
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("vibration");
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
}

function OperatorExposureStatusSensorCell({ onClick, status }: OperatorExposureStatusCellProps) {
	const label = mapDangerLevelToLabel(status);

	return (
		<button type="button" className="w-fit cursor-pointer" onClick={onClick}>
			<ExposureBadge sensor="dust" dangerLevel={status}>
				{label}
			</ExposureBadge>
		</button>
	);
}
