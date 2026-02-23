import type { User } from "@/lib/dto.js";
import { createContext, useContext } from "react";

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
