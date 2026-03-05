import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { InteractiveCard } from "./interactive-card";

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
			<InteractiveCard>
				<CardHeader>
					<CardTitle
						className={`text-center text-${mapDangerLevelToColor(dangerLevel ?? "safe")}`}
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

				<CardContent>
					<Table>
						<TableBody>
							{operators.length === 0 ? (
								<TableRow className="hover:bg-transparent">
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
			</InteractiveCard>
		</Link>
	);
}
