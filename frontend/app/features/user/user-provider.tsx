import type { User } from "@/lib/dto";
import { useState } from "react";
import { UserContext } from "./user-user";

// This user is created in the seed script, so it should always be present in the database.
// It is just for ease of use during the development of the prototype.
const DEFAULT_USER: User = {
	id: "87654321-8765-4321-8765-432187654321",
	username: "Kari Nordmann",
	email: "kari.nordmann@aker.com",
	role: "operator",
	jobDescription: "Sveiser",
	createdAt: new Date(),
	location: {
		id: "22222222-2222-2222-2222-222222222222",
		latitude: 60.29278334510331,
		longitude: 5.279473042646057,
		country: "Norway",
		region: "Bergen",
		city: "Bergen",
		site: "Aker Solutions Sandsli",
		building: null,
	},
};

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User>(DEFAULT_USER);

	return <UserContext value={{ user, setUser }}>{children}</UserContext>;
}
