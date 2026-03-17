import { SensorIcon } from "@/components/sensor-icon";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { dangerlevelStyles } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { type Sensor, sensors } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface HallOperatorListProps {
	operators: Array<UserWithStatusDto>;
	hallName: string;
	selectedHall: string | null;
	onOpen: (hallName: string | null) => void;
	isLoading?: boolean;
}

export const HallOperatorList = ({
	operators,
	hallName,
	selectedHall,
	onOpen,
	isLoading,
}: HallOperatorListProps) => {
	const { t } = useTranslation();
	const isOpen = selectedHall === hallName;

	return (
		<Collapsible
			className="rounded-md"
			open={isOpen}
			onOpenChange={(open) => onOpen(open ? hallName : null)}
		>
			<CollapsibleTrigger asChild>
				<Button variant="ghost" className="group w-full">
					<p>{hallName}</p>

					<p className="text-muted-foreground">
						{isLoading ? (
							<Skeleton className="inline-block h-4 w-6 align-middle" />
						) : (
							`(${operators.length})`
						)}
					</p>

					<ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
				<Table>
					<TableBody>
						{operators.length === 0 ? (
							<TableRow>
								<TableCell className="text-center text-zinc-500">
									{t(
										($) =>
											$.foremanDashboard.siteMap
												.noOperators,
									)}
								</TableCell>
							</TableRow>
						) : (
							operators.map((operator) => {
								return (
									<TableRow
										key={operator.id}
										className="text-muted-foreground"
									>
										{/* TODO: Link? */}
										<TableCell>
											{operator.username}
										</TableCell>
										{sensors.map((sensor) => (
											<HallOperatorListItem
												key={sensor}
												operator={operator}
												sensor={sensor}
											/>
										))}
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</CollapsibleContent>
		</Collapsible>
	);
};

interface HallOperatorListItemProps {
	operator: UserWithStatusDto;
	sensor: Sensor;
}

const HallOperatorListItem = ({
	operator,
	sensor,
}: HallOperatorListItemProps) => {
	const dangerLevel = operator.status[sensor]?.dangerLevel;

	//TODO: I18n
	return (
		<TableCell title="I faresone for støy">
			<SensorIcon
				type={sensor}
				className={cn(dangerlevelStyles[dangerLevel ?? "safe"].bg)}
			/>
		</TableCell>
	);
};
