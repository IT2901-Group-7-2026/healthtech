import { DEFAULT_USER, USER_STORAGE_KEY } from "@/features/user/user-utils";

const baseURL = import.meta.env.VITE_BASE_URL;

function normalizeDatesToUtc(value: unknown): unknown {
	if (value instanceof Date) {
		return new Date(value.getTime()).toISOString();
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeDatesToUtc(item));
	}

	if (value !== null && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, nestedValue]) => [
				key,
				normalizeDatesToUtc(nestedValue),
			]),
		);
	}

	return value;
}

export function toUtcJsonBody(value: unknown): string {
	return JSON.stringify(normalizeDatesToUtc(value));
}

export function toUtcISOString(value: Date): string {
	return new Date(value.getTime()).toISOString();
}

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
export async function fetchWithUserId(
	path: string,
	init?: RequestInit,
): Promise<Response> {
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
