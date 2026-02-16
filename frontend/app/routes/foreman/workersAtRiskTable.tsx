import { useUser } from "@/features/user/user-user";
import {useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

import {
  Table,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function atRiskTable() {
	const navigate = useNavigate();
	const [subordinates, setSubordinates] = useState<any[]>([])
	const { user } = useUser();

	useEffect(() => {
		const fetchSubordinates = async () => {
			try {
				const response = await fetch(
					`http://localhost:5063/api/users/${user.id}/subordinates`
				)

				if (!response.ok) {
					throw new Error("Something went wrong when fetching subordinates")
				}

				const data = await response.json()
				setSubordinates(data)
			} catch (error) {
				console.error(error)
			}
		}

		fetchSubordinates()

	}, [user, navigate])

const getDangerColor = (level: number) => {

    switch (level) {
        case 2:
        return "bg-red-500"
        case 1:
        return "bg-yellow-500"
        default:
        return "bg-green-500"
    }
}

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
            "dark:active:bg-white/15 dark:hover:border-white/60 dark:hover:bg-white/10 dark:hover:ring-zinc-400"
            )}
        >
            {/* TITLE */}
            <CardHeader>
                <CardTitle className="text-center">
                    Workers at risk
                </CardTitle>
            </CardHeader>

            {/* TABLE */}
            <CardContent>
                <Table>
                    <TableBody>
                    {subordinates
                        .filter((sub) => sub.status?.status === "warning" || sub.status?.status === "danger" )
                        .map((sub) => (
                        <TableRow key={sub.id}>
                            <TableCell>
                                <div className="flex items-center gap-5">
                                <div
                                    className={`w-3 h-3 rounded-sm ${getDangerColor(
                                    sub.status!.status
                                    )}`}
                                />
                                <span>{sub.username}</span>
                                </div>                
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* VIEW DETAILS */}
            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p>View details</p>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
        </Card>
        </Link>
	);
}
