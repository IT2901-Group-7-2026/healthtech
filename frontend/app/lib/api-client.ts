import { DEFAULT_USER, USER_STORAGE_KEY } from "@/features/user/user-utils";

const baseURL = import.meta.env.VITE_BASE_URL;

function getSignedInUserId(): string {
	try {
		const stored = localStorage.getItem(USER_STORAGE_KEY);

		if (stored) {
			return JSON.parse(stored).id;
		}
	} catch (error) {
		console.error("Failed to parse user from local storage", error);
		localStorage.removeItem(USER_STORAGE_KEY);
	}

	return DEFAULT_USER.id;
}

// NOTE: For the prototype we don't have proper authentication, so we do a make-shift solution where the client includes the signed in user ID in the query parameters of each request
export async function fetchWithUserId(path: string, init?: RequestInit): Promise<Response> {
	const url = new URL(path, baseURL);
	url.searchParams.set("signedInUserId", getSignedInUserId());

	return fetch(url.toString(), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
}
