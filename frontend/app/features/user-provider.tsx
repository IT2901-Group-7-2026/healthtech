import type { User } from "@/lib/dto.js";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

const KARI_NORDMANN_ID = "87654321-8765-4321-8765-432187654321" as const;
const STORAGE_KEY = "demo_user_id" as const;

const KARI_NORDMANN: User = {
	id: KARI_NORDMANN_ID,
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

type UserContextType = {
	user: User;
	isLoading: boolean;
	setUser: (user: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUserState] = useState<User>(KARI_NORDMANN);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);

			if (stored) {
				setUserState(JSON.parse(stored));
			}
		} catch (error) {
			console.error("Failed to parse user from local storage", error);
			localStorage.removeItem(STORAGE_KEY);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setUser = (newUser: User) => {
		setUserState(newUser);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
	};

	// This assertion is cursed but it's fine
	return (
		<UserContext.Provider value={{ user, isLoading, setUser }}>
			{children}
		</UserContext.Provider>
	);
};

export const useUser = () => {
	const context = useContext(UserContext);

	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}

	return context;
};
