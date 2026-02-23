import { DataTable } from "@/components/ui/data-table";
import { useUser } from "@/features/user-context";
import { useSubordinatesQuery } from "@/lib/api";
import {
	mapDangerLevelToColor,
	mapDangerLevelToLabel,
} from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const TeamPage = () => {
	const { t } = useTranslation();
	const { user } = useUser();
	const navigate = useNavigate();

	useEffect(() => {
		if (user.role !== "foreman") {
			navigate("/");
			return;
		}
	}, [user, navigate]);

	const columns: Array<ColumnDef<UserWithStatusDto>> = [
		{
			accessorKey: "username",
			header: t(($) => $.foremanDashboard.teamTable.username),
		},
		{
			accessorKey: "email",
			header: t(($) => $.foremanDashboard.teamTable.email),
		},
		{
			accessorKey: "jobDescription",
			header: t(($) => $.foremanDashboard.teamTable.jobDescription),
		},
		{
			accessorKey: "status",
			header: t(($) => $.foremanDashboard.teamTable.status),
			cell: ({ row }) => {
				const status = row.original.status.status;
				const label = mapDangerLevelToLabel(status);
				const color = mapDangerLevelToColor(status);

				//TODO: Use a badge component instead of just coloring the text
				// Also add a tooltip with more information about the status and which sensor data is causing it
				return <span className={`text-${color}`}>{label}</span>;
			},
		},
	];
	const {
		data: subordinates,
		isLoading,
		error,
	} = useSubordinatesQuery(user.id);

	if (isLoading) {
		return <div className="p-4">{t(($) => $.loadingData)}</div>;
	}

	if (error) {
		return (
			<div className="p-4 text-destructive">
				{t(($) => $.foremanDashboard.failedToLoadTeamMembers)}
			</div>
		);
	}

	if (!subordinates || subordinates.length === 0) {
		return (
			<div className="p-4">
				{t(($) => $.foremanDashboard.noTeamMembersFound)}
			</div>
		);
	}

	return <DataTable columns={columns} data={subordinates} />;
};

// biome-ignore lint/style/noDefaultExport: page components can be default exports
export default TeamPage;
