import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Sensor } from "@/features/sensor-picker/sensors";
import {
	mapDangerLevelToColor
} from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface Props {
	users: Array<UserWithStatusDto>;
	sensor: Sensor;
	dangerLevel: String;
}

export function ExposureRiskCard({users, sensor, dangerLevel} : Props) {
	const { t } = useTranslation();

	const operators = users.filter(
		(user) => (user.status[sensor]?.level ?? "safe") === dangerLevel,
	);

	// Translate dangerLevel to the correct .json key, used for translations and title colour
	let dangerLabel: "inDanger" | "atRisk" | "withinLimits";
	let colour: "red" | "orange" | "green"
	if (dangerLevel === "danger") {
		dangerLabel = "inDanger"
		colour = "red"
	}
	else if (dangerLevel === "warning") {
		dangerLabel = "atRisk"
		colour = "orange"
	}
	else {
		dangerLabel = "withinLimits"
		colour = "green"
	}

	return (
		<Link
			//TODO: change routing to the subs individual page
			to={`/`}
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
					<CardTitle 
						className="text-center"
						style={{color: colour}}
					>
						{t((x) => x.foremanDashboard.overview.statCards[dangerLabel].label)} {"("} {operators.length} {")"}
					</CardTitle>
				</CardHeader>

				{/* TABLE */}
				<CardContent>
					<Table>
						<TableBody>
							{operators.length === 0 ? (
								<TableRow>
									<TableCell className="text-center text-zinc-500">
										{t((x) => x.foremanDashboard.overview.statCards[dangerLabel].noOperators)}
									</TableCell>
								</TableRow>
							) : (
								operators.map((sub) => (
									<TableRow key={sub.id}>
										<TableCell>
											<div className="flex items-center gap-5">
												<div
													className={`h-3 w-3 rounded-sm bg-${mapDangerLevelToColor((sub.status[sensor]?.level ?? "safe"))}`}
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
					<p>{t((x) => x.foremanDashboard.overview.statCards.viewDetails)}</p>
					<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</div>
			</Card>
		</Link>
);
}
