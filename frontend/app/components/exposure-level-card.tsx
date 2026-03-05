import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";

interface Props {
	users: Array<UserWithStatusDto>;
	sensor: Sensor;
	dangerLevel: "safe" | "warning" | "danger";
}

export function ExposureRiskCard({ users, sensor, dangerLevel }: Props) {
	const { t } = useTranslation();

	const operators = users.filter(
		(user) => (user.status[sensor]?.dangerLevel ?? "safe") === dangerLevel,
	);

	return (
		<Link
			//TODO: change routing to the subs individual page
			to={`/`}
			className="h-full w-full flex-1 basis-64 rounded-2xl"
		>
			<Card className="group h-full justify-between gap-4 p-4">
				{/* TITLE */}
				<CardHeader>
					<CardTitle
						className={`text-center text-${mapDangerLevelToColor(dangerLevel ?? "safe")}`}
						//style={{ color: "red"}}
					>
						{t(
							(x) =>
								x.foremanDashboard.overview.statCards[
									dangerLevel
								].label,
						)}{" "}
						{`(${operators.length})`}
					</CardTitle>
				</CardHeader>

				{/* TABLE */}
				<CardContent>
					<Table>
						<TableBody>
							{operators.length === 0 ? (
								<TableRow>
									<TableCell className="text-center text-zinc-500">
										{t(
											(x) =>
												x.foremanDashboard.overview
													.statCards[dangerLevel]
													.noOperators,
										)}
									</TableCell>
								</TableRow>
							) : (
								operators.map((sub) => (
									<TableRow key={sub.id}>
										<TableCell>
											<div className="flex items-center gap-5">
												<div
													className={`h-3 w-3 rounded-sm bg-${mapDangerLevelToColor(sub.status[sensor]?.dangerLevel ?? "safe")}`}
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
					<p>
						{t(
							(x) =>
								x.foremanDashboard.overview.statCards
									.viewDetails,
						)}
					</p>
					<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</div>
			</Card>
		</Link>
	);
}
