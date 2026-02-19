import { useUser } from "@/features/user-provider.js";
import { UserRole } from "@/lib/dto.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ErrorBoundary } from "../root.js";

// biome-ignore lint: page components can be default exports
export default function Page() {
	const { user } = useUser();
	const navigate = useNavigate();
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (user.role === UserRole.Operator) {
			navigate("/operator/");
			return;
		}

		if (user.role === UserRole.Foreman) {
			navigate("/foreman/");
			return;
		}

		setError(new Error(`Unknown user role "${user.role}"`));
	}, [user, navigate]);

	if (error) {
		return <ErrorBoundary params={{}} error={error} />;
	}

	return "Loading...";
}
