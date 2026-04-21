import { ExposureBadge } from "@/components/exposure-badge";
import { DataTable } from "@/components/ui/data-table";
import { mapDangerLevelToLabel } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import type { ColumnDef } from "@tanstack/react-table";
import { t } from "i18next";

export interface SensorTableCellProps {
	data: Array<UserWithStatusDto> | undefined;
	setSelectedUserId: (userId: string) => void;
	setSensor: (sensor: string) => void;
}

export function SensorTableCell({ data, setSelectedUserId, setSensor }: SensorTableCellProps) {
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
				const label = mapDangerLevelToLabel(status);

				return (
					<button
						type="button"
						className="w-fit cursor-pointer"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("dust");
						}}
					>
						<ExposureBadge sensor="dust" dangerLevel={status}>
							{label}
						</ExposureBadge>
					</button>
				);
			},
		},
		{
			id: "noise",
			header: t(($) => $.sensors.noise),
			cell: ({ row }) => {
				const status = row.original.status.noise?.dangerLevel ?? "safe";
				const label = mapDangerLevelToLabel(status);

				return (
					<button
						type="button"
						className="w-fit cursor-pointer"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("noise");
						}}
					>
						<ExposureBadge sensor="noise" dangerLevel={status}>
							{label}
						</ExposureBadge>
					</button>
				);
			},
		},
		{
			id: "vibration",
			header: t(($) => $.sensors.vibration),
			cell: ({ row }) => {
				const status = row.original.status.vibration?.dangerLevel ?? "safe";
				const label = mapDangerLevelToLabel(status);

				return (
					<button
						type="button"
						className="w-fit cursor-pointer"
						onClick={() => {
							setSelectedUserId(row.original.id);
							setSensor("vibration");
						}}
					>
						<ExposureBadge sensor="vibration" dangerLevel={status}>
							{label}
						</ExposureBadge>
					</button>
				);
			},
		},
	];

	return <DataTable columns={columns} data={data ?? []} getRowId={(teamMember) => teamMember.id} />;
}
