import { SignupForm } from "@/components/signup-form.js";
import { DemoUserSwitchBanner } from "@/features/navbar/demo-user-switch-banner.js";
import { useUser } from "@/features/user/user-context.js";
import { usersQueryOptions } from "@/lib/api.js";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
	const { user, setUser } = useUser();
	const { data: users } = useQuery(usersQueryOptions());

	return (
		<div className="min-h-svh">
			<DemoUserSwitchBanner user={user} users={users} setUser={setUser} />
			<div className="flex w-full items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-sm">
					<SignupForm />
				</div>
			</div>
		</div>
	);
}
