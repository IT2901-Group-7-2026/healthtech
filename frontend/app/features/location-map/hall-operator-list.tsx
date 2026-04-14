import { SensorIcon } from "@/components/sensor-icon";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { UserWithStatusDto } from "@/lib/dto";
import { type Sensor, sensors } from "@/lib/sensors";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export interface HallOperatorListProps {
	sensor: Sensor | "all";
	operators: Array<UserWithStatusDto>;
	hallName: string;
	selectedHall: string | null;
	onOpenChange: (hallName: string | null) => void;
}

export const HallOperatorList = ({
	sensor,
	operators,
	hallName,
	selectedHall,
	onOpenChange,
}: HallOperatorListProps) => {
	const { t } = useTranslation();
	const isOpen = selectedHall === hallName;

	return (
		<Collapsible className="rounded-md" open={isOpen} onOpenChange={(open) => onOpenChange(open ? hallName : null)}>
			<CollapsibleTrigger asChild={true}>
				<Button variant="ghost" className="group w-full">
					<p>{hallName}</p>

					<p className="text-muted-foreground">{`(${operators.length})`}</p>

					<ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
				<Table>
					<TableBody>
						{operators.length === 0 ? (
							<TableRow>
								<TableCell className="text-center text-zinc-500">
									{t(($) => $.foremanDashboard.siteMap.noOperators)}
								</TableCell>
							</TableRow>
						) : (
							operators.map((operator) => (
								<TableRow key={operator.id} className="text-muted-foreground">
									<TableCell>
										<Link
											to={`/foreman/?userId=${operator.id}`}
											title={`View ${operator.username}`}
											aria-label={`View user ${operator.username}`}
											className="relative block text-muted-foreground hover:text-white"
										>
											{operator.username}
										</Link>
									</TableCell>
									{sensor === "all" ? (
										sensors.map((s) => (
											<HallOperatorListItem key={s} operator={operator} sensor={s} />
										))
									) : (
										<HallOperatorListItem operator={operator} sensor={sensor} />
									)}
								</TableRow>
							))
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

const HallOperatorListItem = ({ operator, sensor }: HallOperatorListItemProps) => {
	const { t } = useTranslation();

	const dangerLevel = operator.status[sensor]?.dangerLevel ?? "safe";
	const title = t(($) => $.foremanDashboard.siteMap.operatorSensorStatus[dangerLevel], {
		sensor: t(($$) => $$.sensors[sensor]).toLowerCase(),
	});

	return (
		<TableCell className="items-center">
			<Link
				to={`/foreman?userId=${operator.id}&sensor=${sensor}`}
				title={title}
				aria-label={`View ${sensor} data for ${operator.username}`}
				className="block w-fit"
			>
				<SensorIcon
					type={sensor}
					size="xs"
					dangerLevel={dangerLevel}
					className="w-fit cursor-pointer transition-transform hover:scale-110"
				/>
			</Link>
		</TableCell>
	);
};

export const HallOperatorListSkeleton = () => <Skeleton className="h-9 w-full rounded-md bg-zinc-100 dark:bg-accent" />;
