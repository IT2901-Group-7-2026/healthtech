import { useUser } from "@/features/user/user-user";
import {useState, useEffect } from "react";
import { useNavigate } from "react-router";

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

console.log(subordinates)

return (
    <><div className="flex w-full flex-col items-center md:items-start">
            <Card className="w-80 max-w-3xl">
                <CardHeader>
                    <CardTitle className="text-center">Workers at risk</CardTitle>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableBody>
                        {subordinates.map((sub) => (
                            <TableRow key={sub.id}>
                                    <div className="flex items-center gap-2">
                                <div
                                className={`w-3 h-3 rounded-sm ${getDangerColor(
                                    sub.status?.status ?? 0
                                )}`}
                                />
                                <span>{sub.username}</span>
                            </div>
                            </TableRow>
                            ))}

                            {subordinates.map((sub) => (
                            <TableRow key={sub.id}>
                                    <div className="flex items-center gap-2">
                                <div
                                className={`w-3 h-3 rounded-sm ${getDangerColor(
                                    sub.status?.status ?? 0
                                )}`}
                                />
                                <span>{sub.username}</span>
                            </div>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div></>
	);
}
