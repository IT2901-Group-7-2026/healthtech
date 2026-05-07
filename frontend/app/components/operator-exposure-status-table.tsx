import { ExposureBadge } from "@/components/exposure-badge.tsx";
import { DataTable } from "@/components/ui/data-table.tsx";
import { type DangerLevel, mapDangerLevelToLabel } from "@/lib/danger-levels.ts";
import type { UserWithStatusDto } from "@/lib/dto/user.ts";
import type { Exposure } from "@/lib/exposures.ts";
import type { ColumnDef } from "@tanstack/react-table";
import { t } from "i18next";
import { Link, useSearchParams } from "react-router";

export interface ExposureTableCellProps {
	data: Array<UserWithStatusDto> | undefined;
}

export function OperatorExposureStatusTable({ data }: ExposureTableCellProps) {
	const [searchParams] = useSearchParams();

	const buildSearchParams = (userId: string, exposure?: Exposure) => {
		const params = new URLSearchParams(searchParams);
		params.set("userId", userId);

		if (exposure) {
			params.set("exposure", exposure);
		} else {
			params.delete("exposure");
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
			header: t(($) => $.exposures.dust),
			cell: ({ row }) => {
				const status = row.original.status.dust?.dangerLevel ?? "safe";

				return (
					<OperatorExposureStatusExposureCell
						status={status}
						exposure="dust"
						search={buildSearchParams(row.original.id, "dust")}
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
						search={buildSearchParams(row.original.id, "noise")}
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
	exposure: Exposure;
}

function OperatorExposureStatusExposureCell({ search, status, exposure }: OperatorExposureStatusCellProps) {
	const label = mapDangerLevelToLabel(status);

	return (
		<Link
			to={{
				search,
			}}
			className="block w-fit cursor-pointer rounded-full hover:brightness-95"
		>
			<ExposureBadge exposure={exposure} dangerLevel={status}>
				{label}
			</ExposureBadge>
		</Link>
	);
}
