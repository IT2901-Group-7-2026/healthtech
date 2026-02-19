import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useUser } from "@/features/user-provider.js";
import { useSubordinatesQuery } from "@/lib/api";
import { DANGER_LEVEL_SEVERITY, mapDangerLevelToColor, type DangerLevel } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function AtRiskTable() {
	const { t } = useTranslation();
	const { user } = useUser();
	const { data: subordinates = [] } = useSubordinatesQuery(user.id);

	const getDangerColor = (level: DangerLevel) => {
		if (level === "danger") return "bg-red-500";
		if (level === "warning") return "bg-yellow-500";
		// should never procc
		return "bg-green-500";
	};

	const atRiskWorkers = subordinates.filter(
		(sub) => DANGER_LEVEL_SEVERITY[sub.status.status] > 0,
	);

	return (
		<Link
			//TODO: change routing to the subs individual page
			to={`/foreman/team/`}
			className="h-full w-full flex-1 basis-64 rounded-2xl"
		>
			<Card
				className={cn(
					"group flex h-full flex-col justify-between gap-4 border border-white/10 bg-white/5 p-4 transition-colors hover:ring-1",
					"hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/60 hover:ring-zinc-200 active:bg-zinc-50 active:shadow-sm",
					"dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400",
				)}
			>
				{/* TITLE */}
				<CardHeader>
					<CardTitle className="text-center">
						{t((x) => x.atRiskTable.title)}
					</CardTitle>
				</CardHeader>

				{/* TABLE */}
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
				{/* VIEW DETAILS */}
				<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
					<p>{t((x) => x.atRiskTable.detailText)}</p>
					<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</div>
			</Card>
		</Link>
	);
}
