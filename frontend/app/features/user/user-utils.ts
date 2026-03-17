import type { User } from "@/lib/dto";

export const USER_STORAGE_KEY = "demo_user_id" as const;

export const OLA_NORDMANN_ID = "12345678-1234-5678-1234-567812345678" as const;
export const KARI_NORDMANN_ID = "87654321-8765-4321-8765-432187654321" as const;

export const DEFAULT_USER: User = {
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
		building: "Bygg 1",
	},
};
