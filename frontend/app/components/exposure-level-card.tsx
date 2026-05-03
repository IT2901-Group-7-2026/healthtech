import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Exposure } from "@/features/exposure-picker/exposures";
import { dangerlevelStyles } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ExposureIcon } from "./exposure-icon.js";

interface Props {
	users: Array<UserWithStatusDto>;
	exposure: Exposure;
	dangerLevel: "safe" | "warning" | "danger";
	onUserClick?: (userId: string | null) => void;
}

export function ExposureRiskCard({ users, exposure, dangerLevel, onUserClick }: Props) {
	const { t } = useTranslation();

	const operators = users.filter((user) => (user.status[exposure]?.dangerLevel ?? "safe") === dangerLevel);

	const { bgSubtle, border, text } = dangerlevelStyles[dangerLevel];

	return (
		<Card className="group w-full flex-1 basis-64 p-2">
			<CardHeader
				className={cn("flex justify-between gap-3 rounded-lg border px-3 py-2", bgSubtle, border, text)}
			>
				<div className="flex gap-3">
					<ExposureIcon
						size="xs"
						iconOnly={true}
						type={exposure}
						iconClassName="size-4.5 mt-0.5"
						dangerLevel={dangerLevel}
						dangerLevelClassName="-bottom-0.75 -right-0.75"
					/>

					<h3 className={cn("font-medium text-sm/4 my-auto", text)}>
						{t((x) => x.foremanDashboard.overview.statCards[dangerLevel].label)}
					</h3>
				</div>

				{operators.length > 0 && <p className="text-lg/5 tabular-nums">{operators.length}</p>}
			</CardHeader>

			<CardContent>
				<Table>
					<TableBody className="mx-0">
						{operators.length === 0 ? (
							<TableRow className="border-none hover:bg-transparent">
								<TableCell className="whitespace-normal text-zinc-500">
									{t((x) => x.foremanDashboard.overview.statCards[dangerLevel].noOperators)}
								</TableCell>
							</TableRow>
						) : (
							operators.map((sub) => (
								<TableRow
									key={sub.id}
									onClick={() => onUserClick?.(sub.id)}
									className="cursor-pointer rounded-lg border-none even:bg-zinc-100/75 hover:bg-accent dark:hover:bg-accent dark:even:bg-zinc-700/33"
								>
									<TableCell className="rounded-lg px-3">
										<p>{sub.name}</p>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
