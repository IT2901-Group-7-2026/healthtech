import type { User } from "@/lib/dto";
import { createContext, useContext } from "react";

type ContextValue = {
	user: User;
	setUser: (user: User) => void;
};

export const UserContext = createContext<ContextValue | undefined>(undefined);

export const useUser = (): ContextValue => {
	const context = useContext(UserContext);

	if (!context) {
		throw new Error("useUser must be used within a UserProvider");
	}

	return context;
};
