import { ExposureBadge } from "@/components/exposure-badge";
import { DataTable } from "@/components/ui/data-table";
import { type DangerLevel, mapDangerLevelToLabel } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import type { ColumnDef } from "@tanstack/react-table";
import { t } from "i18next";
import { Link, useSearchParams } from "react-router";

export interface SensorTableCellProps {
	data: Array<UserWithStatusDto> | undefined;
}

export function OperatorExposureStatusTable({ data }: SensorTableCellProps) {
	const [searchParams] = useSearchParams();

	const buildSearchParams = (userId: string, sensor?: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("userId", userId);

		if (sensor) {
			params.set("sensor", sensor);
		} else {
			params.delete("sensor");
		}

		return params.toString();
	};

	const columns: Array<ColumnDef<UserWithStatusDto>> = [
		{
			id: "name",
			accessorKey: "name",
			header: t(($) => $.foremanDashboard.team.table.name),
			cell: ({ row }) => (
				<Link
					to={{ search: buildSearchParams(row.original.id, undefined) }}
					className="font-medium hover:underline"
				>
					{row.original.name}
				</Link>
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
						sensor="dust"
						search={buildSearchParams(row.original.id, "dust")}
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
						sensor="noise"
						search={buildSearchParams(row.original.id, "noise")}
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
						sensor="vibration"
						search={buildSearchParams(row.original.id, "vibration")}
					/>
				);
			},
		},
	];

	return <DataTable columns={columns} data={data ?? []} getRowId={(teamMember) => teamMember.id} />;
}

interface OperatorExposureStatusCellProps {
	search: string;
	status: DangerLevel;
	sensor: Sensor;
}

function OperatorExposureStatusSensorCell({ search, status, sensor }: OperatorExposureStatusCellProps) {
	const label = mapDangerLevelToLabel(status);

	return (
		<Link
			to={{
				search,
			}}
			className="block w-fit cursor-pointer rounded-full hover:brightness-95"
		>
			<ExposureBadge sensor={sensor} dangerLevel={status}>
				{label}
			</ExposureBadge>
		</Link>
	);
}
