import type { User } from "@/lib/dto";
import { useState } from "react";
import { UserContext } from "./user-user";

// This user is created in the seed script, so it should always be present in the database.
// It is just for ease of use during the development of the prototype.
const DEFAULT_USER: User = {
    id: "12345678-1234-5678-1234-567812345678",
    username: "testuser1",
    email: "test1@example.com",
    jobDescription: null,
    createdAt: new Date(),
}

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User>(DEFAULT_USER);

	return <UserContext value={{ user, setUser }}>{children}</UserContext>;
}
