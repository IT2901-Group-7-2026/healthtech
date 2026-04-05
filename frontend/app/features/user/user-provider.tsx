import type { User } from "@/lib/dto.js";
import { type ReactNode, useEffect, useState } from "react";
import { UserContext } from "./user-context";
import { DEFAULT_USER, USER_STORAGE_KEY } from "./user-utils";

export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUserState] = useState<User>(DEFAULT_USER);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(USER_STORAGE_KEY);

			if (stored) {
				setUserState(JSON.parse(stored));
			}
		} catch (error) {
			console.error("Failed to parse user from local storage", error);
			localStorage.removeItem(USER_STORAGE_KEY);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setUser = (newUser: User) => {
		setUserState(newUser);
		localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
	};

	// This assertion is cursed but it's fine
	return <UserContext.Provider value={{ user, isLoading, setUser }}>{children}</UserContext.Provider>;
};
