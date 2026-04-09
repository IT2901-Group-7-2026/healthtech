// biome-ignore-all lint/nursery/noShadow: Allow us to use the variable name "user" in different scopes

import { LocationMap } from "@/features/location-map/location-map";
import { useUser } from "@/features/user/user-context";
import { fetchSubordinatesQueryOptions } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function MapPage() {
	const { t } = useTranslation();
	const { user } = useUser();

	const {
		data: subordinates,
		isLoading: isSubordinatesLoading,
		error: subordinatesError,
	} = useQuery(fetchSubordinatesQueryOptions(user.id));

	if (isSubordinatesLoading) {
		return <div className="p-4">{t(($) => $.common.loading)}</div>;
	}

	if (subordinatesError) {
		return <div className="p-4 text-destructive">{t(($) => $.foremanDashboard.team.failedToLoadMembers)}</div>;
	}

	if (!subordinates || subordinates.length === 0) {
		return <div className="p-4">{t(($) => $.foremanDashboard.team.noMembersFound)}</div>;
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<h1 className="font-bold text-2xl">{t(($) => $.foremanDashboard.team.mapTitle)}</h1>
			<LocationMap operators={subordinates ?? []} isLoading={isSubordinatesLoading} />
		</div>
	);
}
