import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BasePopup } from "@/features/popups/base-popup";
import { useUser } from "@/features/user-context";
import { useSubordinatesQuery } from "@/lib/api";
import {
  DANGER_LEVEL_SEVERITY,
  mapDangerLevelToColor,
  type DangerLevel,
} from "@/lib/danger-levels";
import { t } from "i18next";
import { ArrowRightIcon} from "lucide-react";
import { Link } from "react-router";

export function AtRiskPopup({
  status,
  open,
  onClose,
}: {
  title: string;
  status: DangerLevel;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const { data: subordinates = [] } = useSubordinatesQuery(user.id);

  const exposureTitle =
  status === "danger"
    ? t((x) => x.exposureLevel.in_danger)
    : status === "warning"
    ? t((x) => x.exposureLevel.warning)
    : t((x) => x.exposureLevel.safe);
	
  const workers =
    status === "safe"
      ? subordinates.filter(
          (sub) => DANGER_LEVEL_SEVERITY[sub.status.status] === 0
        )
      : subordinates.filter(
          (sub) => sub.status.status === status
        );

  return (
    <BasePopup
      title={exposureTitle}
      open={open}
      relevantDate={null}
      onClose={onClose}
    >
    	<Card
  			className="border border-white/10 bg-white/5 p-4 dark:border-white/10 dark:bg-white/5"
		>
			<CardContent>
				<Table>
					<TableBody>
						{workers.length === 0 ? (
							<TableRow>
								<TableCell className="text-center text-zinc-500">
									{t((x) => x.exposureLevel.no_in_danger)}
								</TableCell>
							</TableRow>
						) : (
							workers.map((worker) => (
								<Link
									//TODO: change routing to the subs individual page
									to={`/foreman/team/`}
									className="h-full w-full flex-1 basis-4 rounded-2xl"
								>
									<TableRow key={worker.id}>
										<TableCell>
											<div className="flex items-center gap-5">
											<div
												className={`h-3 w-3 rounded-sm bg-${mapDangerLevelToColor(
												worker.status.status
												)}`}
											/>
											<span>{worker.username}</span>

											</div>
										</TableCell>
									</TableRow>
								</Link>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
			{/* VIEW DETAILS */}
			<Link
				to={`/foreman/team/`}
				className="h-full w-full flex-1 basis-4 rounded-2xl"
			>
				<div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
					<p>{t((x) => x.atRiskTable.detailText)}</p>
					<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</div>
			</Link>
		</Card>
    </BasePopup>
  );
}
