import { SignupForm } from "@/components/signup-form.js";
import { Button } from "@/components/ui/button.js";
import { useUser } from "@/features/user/user-context.js";
import { usersQueryOptions } from "@/lib/api.js";
import { UserRole } from "@/lib/dto.js";
import { userRoleToString } from "@/lib/utils.js";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function Page() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { setUser } = useUser();
	const { data: users } = useQuery(usersQueryOptions());

	const handleDemoClick = (
		role: (typeof UserRole)[keyof typeof UserRole],
	) => {
		const userForRole = users?.find((u) => u.role === role);
		if (!userForRole) return;

		setUser(userForRole);
		navigate("/");
	};

	return (
		<div className="min-h-svh">
			<div className="flex w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
				<div className="w-full max-w-sm">
					<SignupForm />
				</div>

				<div className="flex w-full max-w-sm flex-col rounded-xl bg-yellow-100 p-4 text-zinc-700 dark:bg-amber-950 dark:text-zinc-100">
					<p className="font-bold text-sm text-zinc-600 dark:text-zinc-300">
						{"DEMO"}
					</p>
					<div className="mt-2 flex gap-3">
						<Button
							type="button"
							size="lg"
							className="flex-1 bg-amber-200 font-semibold text-zinc-600 hover:bg-amber-300 dark:bg-amber-900/75 dark:text-zinc-300 dark:hover:bg-amber-800"
							onClick={() => handleDemoClick(UserRole.Operator)}
							disabled={!users}
						>
							<span>{userRoleToString("operator", t)}</span>
						</Button>

						<Button
							type="button"
							size="lg"
							className="flex-1 bg-amber-200 font-semibold text-zinc-600 hover:bg-amber-300 dark:bg-amber-900/75 dark:text-zinc-300 dark:hover:bg-amber-800"
							onClick={() => handleDemoClick(UserRole.Foreman)}
							disabled={!users}
						>
							<span>{userRoleToString("foreman", t)}</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
