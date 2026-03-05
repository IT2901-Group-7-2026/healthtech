import { InteractiveCard } from "@/components/interactive-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
	DANGER_LEVEL_SEVERITY,
	mapDangerLevelToColor,
} from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface Props {
	users: Array<UserWithStatusDto>;
}

export function AtRiskTable({ users }: Props) {
	const { t } = useTranslation();

	const atRiskWorkers = users.filter(
		(user) => DANGER_LEVEL_SEVERITY[user.status.status] > 0,
	);

	return (
		<Link
			//TODO: change routing to the subs individual page
			to={`/foreman/team/`}
			className="h-full w-full flex-1 basis-64 rounded-2xl"
		>
			<InteractiveCard>
				<CardHeader>
					<CardTitle className="text-center">
						{t((x) => x.atRiskTable.title)}
					</CardTitle>
				</CardHeader>

				<CardContent>
					<Table>
						<TableBody>
							{atRiskWorkers.length === 0 ? (
								<TableRow>
									<TableCell className="text-center text-zinc-500">
										{t((x) => x.atRiskTable.noWorkers)}
									</TableCell>
								</TableRow>
							) : (
								atRiskWorkers.map((sub) => (
									<TableRow key={sub.id}>
										<TableCell>
											<div className="flex items-center gap-5">
												<div
													className={`h-3 w-3 rounded-sm bg-${mapDangerLevelToColor(sub.status.status)}`}
												/>
												<span>{sub.username}</span>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</InteractiveCard>
		</Link>
	);
}
