import type { User } from "@/lib/dto.js";
import { createContext, useContext } from "react";

export const OLA_NORDMANN_ID = "12345678-1234-5678-1234-567812345678" as const;
export const KARI_NORDMANN_ID = "87654321-8765-4321-8765-432187654321" as const;

type UserContextType = {
	user: User;
	isLoading: boolean;
	setUser: (user: User) => void;
};

export const UserContext = createContext<UserContextType | undefined>(
	undefined,
);

export const useUser = () => {
	const context = useContext(UserContext);

	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}

	return context;
};
