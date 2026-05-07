import { ExposureIcon } from "@/components/exposure-icon";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { UserWithStatusDto } from "@/lib/dto/user";
import { type Exposure, exposures } from "@/lib/exposures";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export interface HallOperatorListProps {
	exposure: Exposure | "all";
	operators: Array<UserWithStatusDto>;
	hallName: string;
	selectedHall: string | null;
	onOpenChange: (hallName: string | null) => void;
}

export const HallOperatorList = ({
	exposure,
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
											title={t(($) => $.foremanDashboard.siteMap.viewUser, {
												name: operator.name,
											})}
											aria-label={t(($) => $.foremanDashboard.siteMap.viewUserAria, {
												name: operator.name,
											})}
											className="relative block text-muted-foreground hover:text-white"
										>
											{operator.name}
										</Link>
									</TableCell>
									{exposure === "all" ? (
										exposures.map((s) => (
											<HallOperatorListItem key={s} operator={operator} exposure={s} />
										))
									) : (
										<HallOperatorListItem operator={operator} exposure={exposure} />
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
	exposure: Exposure;
}

const HallOperatorListItem = ({ operator, exposure }: HallOperatorListItemProps) => {
	const { t } = useTranslation();

	const dangerLevel = operator.status[exposure]?.dangerLevel ?? "safe";
	const title = t(($) => $.foremanDashboard.siteMap.operatorExposureStatus[dangerLevel], {
		exposure: t(($$) => $$.exposures[exposure]).toLowerCase(),
	});

	return (
		<TableCell className="items-center">
			<Link
				to={`/foreman?userId=${operator.id}&exposure=${exposure}`}
				title={title}
				aria-label={t(($) => $.foremanDashboard.siteMap.viewExposureData, {
					name: operator.name,
					exposure: t(($$) => $$.exposures[exposure]).toLowerCase(),
				})}
				className="block w-fit"
			>
				<ExposureIcon
					type={exposure}
					size="xs"
					dangerLevel={dangerLevel}
					className="w-fit cursor-pointer transition-transform hover:scale-110"
				/>
			</Link>
		</TableCell>
	);
};

export const HallOperatorListSkeleton = () => <Skeleton className="h-9 w-full rounded-md bg-zinc-100 dark:bg-accent" />;
