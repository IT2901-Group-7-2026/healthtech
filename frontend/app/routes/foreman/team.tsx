// biome-ignore-all lint/nursery/noShadow: user user user

import { Button } from "@/components/ui/button.js";
import { Checkbox } from "@/components/ui/checkbox.js";
import { DataTable } from "@/components/ui/data-table";
import { LocationMap } from "@/features/location-map/location-map";
import { useUser } from "@/features/user/user-context";
import { UserSearch } from "@/features/user/user-search.js";
import {
	fetchSubordinatesQueryOptions,
	useAddSubordinatesMutation,
	useRemoveSubordinatesMutation,
	usersQueryOptions,
} from "@/lib/api";
import { mapDangerLevelToColor, mapDangerLevelToLabel } from "@/lib/danger-levels";
import { type User, UserRole, type UserWithStatusDto } from "@/lib/dto";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function TeamPage() {
	const { t } = useTranslation();
	const { user } = useUser();

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [userIdSelection, setUserIdSelection] = useState<Array<User>>([]);

	const columns: Array<ColumnDef<UserWithStatusDto>> = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label={t(($) => $.select.all)}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label={t(($) => $.select.row)}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "username",
			accessorKey: "username",
			header: t(($) => $.foremanDashboard.team.table.username),
		},
		{
			id: "email",
			accessorKey: "email",
			header: t(($) => $.foremanDashboard.team.table.email),
		},
		{
			id: "jobDescription",
			accessorKey: "jobDescription",
			header: t(($) => $.foremanDashboard.team.table.jobDescription),
		},
		{
			id: "status",
			header: t(($) => $.foremanDashboard.team.table.status),
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
		isLoading: isSubordinatesLoading,
		error: subordinatesError,
	} = useQuery(fetchSubordinatesQueryOptions(user.id));

	const { data: users } = useQuery(usersQueryOptions());

	const filteredUsers = useMemo(() => {
		if (!(users && subordinates)) {
			return [];
		}

		const subordinateIds = new Set(subordinates.map((s) => s.id));

		return users.filter((user) => user.role === UserRole.Operator && !subordinateIds.has(user.id));
	}, [users, subordinates]);

	const addSubordinates = useAddSubordinatesMutation(user.id);
	const removeSubordinates = useRemoveSubordinatesMutation(user.id);

	const handleAddSubordinates = () => {
		if (userIdSelection.length === 0) {
			return;
		}

		const userIds = userIdSelection.map((user) => user.id);

		addSubordinates.mutate(userIds, {
			onSuccess: () => {
				setUserIdSelection([]);
			},
		});
	};

	const handleRemoveSubordinates = () => {
		const selectedIds = Object.keys(rowSelection);

		removeSubordinates.mutate(selectedIds, {
			onSuccess: () => {
				setRowSelection({});
			},
		});
	};

	if (isSubordinatesLoading) {
		return <div className="p-4">{t(($) => $.loadingData)}</div>;
	}

	if (subordinatesError) {
		return <div className="p-4 text-destructive">{t(($) => $.foremanDashboard.team.failedToLoadMembers)}</div>;
	}

	if (!subordinates || subordinates.length === 0) {
		return <div className="p-4">{t(($) => $.foremanDashboard.team.noMembersFound)}</div>;
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<h1 className="font-bold text-2xl">{t(($) => $.foremanDashboard.team.title)}</h1>
				<div className="flex items-center gap-2">
					<UserSearch
						users={filteredUsers}
						placeholder={t(($) => $.user.searchPlaceholder)}
						multiple={true}
						value={userIdSelection}
						onValueChange={(value) => {
							if (value == null || value.length === 0) {
								setUserIdSelection([]);
								return;
							}

							setUserIdSelection(value);
						}}
						disabled={filteredUsers.length === 0}
						emptyLabel={t(($) => $.noOptions)}
					/>
					<Button onClick={handleAddSubordinates} disabled={userIdSelection.length === 0}>
						{t(($) => $.foremanDashboard.team.action.addSubordinate)}
					</Button>
				</div>
				<DataTable
					columns={columns}
					data={subordinates}
					selectionLabelT={t}
					state={{ rowSelection }}
					onRowSelectionChange={setRowSelection}
					getRowId={(user) => user.id}
				/>
				<div>
					<Button
						onClick={handleRemoveSubordinates}
						disabled={Object.keys(rowSelection).length === 0}
						variant="destructive"
					>
						{t(($) => $.foremanDashboard.team.action.removeSubordinate)}
					</Button>
				</div>
			</div>
			<div className="flex w-full flex-col gap-4">
				<h1 className="font-bold text-2xl">{t(($) => $.foremanDashboard.team.mapTitle)}</h1>
				<p className="text-muted-foreground">{`(${t(($) => $.foremanDashboard.team.mapPlaceholder)})`}</p>
				<LocationMap operators={subordinates ?? []} isLoading={isSubordinatesLoading} />
			</div>
		</div>
	);
}
