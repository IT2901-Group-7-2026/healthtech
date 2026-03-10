import { MapPinIcon, UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card.js";
import { createLocationName } from "@/lib/dto.js";
import { useUser } from "../user/user-context.js";

export const TeamSummary = ({
	subordinateCount,
}: {
	subordinateCount: number;
}) => {
	const { t } = useTranslation();
	const { user } = useUser();

	return (
		<Card muted>
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
					{t(($) => $.sidebar.yourTeam)}
				</h2>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2">
					<MapPinIcon size="1rem" />
					<p className="text-sm">
						{createLocationName(user.location)}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<UsersIcon size="1rem" />
					<p className="text-sm">
						{t(($) => $.foremanDashboard.team.membersCount, {
							count: subordinateCount,
						})}
					</p>
				</div>
			</CardContent>
		</Card>
	);
};
