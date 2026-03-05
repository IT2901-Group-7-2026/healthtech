import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { type User, type UserRole, UserRoleSchema } from "@/lib/dto.js";
import { cn, userRoleToString } from "@/lib/utils.js";

interface DemoUserSwitchBannerProps {
	user: User;
	users: Array<User> | undefined;
	setUser: (user: User) => void;
}

export const DemoUserSwitchBanner = ({
	user,
	users,
	setUser,
}: DemoUserSwitchBannerProps) => {
	const { t } = useTranslation();

	return (
		<div className="flex justify-between gap-8 bg-yellow-100 px-2 py-1 dark:bg-amber-950">
			<div className="flex flex-row items-center gap-8">
				<p className="font-bold text-xs text-zinc-600 dark:text-zinc-300">
					{"DEMO"}
				</p>

				<div className="flex gap-3">
					{users !== undefined ? (
						Object.keys(UserRoleSchema.enum).map((role) => (
							<Button
								key={role}
								className={cn(
									"h-fit px-1.5 py-0.5 text-[0.625rem] text-zinc-600 dark:text-zinc-300",
									"bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/75 dark:hover:bg-amber-800",
									user?.role === role &&
										"bg-amber-300 dark:bg-amber-800",
								)}
								onClick={() => {
									const userWithRole = users.find(
										(u) => u.role === role,
									);
									if (userWithRole) {
										setUser(userWithRole);
									}
								}}
							>
								{userRoleToString(role as UserRole, t)}
							</Button>
						))
					) : (
						<Skeleton className="h-4.5 w-28.5 bg-amber-200 dark:bg-amber-900/75" />
					)}
				</div>

				{user.role && (
					<p className="text-xs text-zinc-600 dark:text-zinc-300">
						{t(($) => $.demo.currentRole)}{" "}
						<span className="font-semibold">
							{userRoleToString(user.role, t)}
						</span>
					</p>
				)}
			</div>

			<div className="flex items-center gap-3">
				<Button
					className={cn(
						"h-fit px-1.5 py-0.5 text-[0.625rem] text-zinc-600 dark:text-zinc-300",
						"bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/75 dark:hover:bg-amber-800",
					)}
					asChild
				>
					<Link to="/">{t(($) => $.demo.navigate.toApp)}</Link>
				</Button>

				<Button
					className={cn(
						"h-fit px-1.5 py-0.5 text-[0.625rem] text-zinc-600 dark:text-zinc-300",
						"bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/75 dark:hover:bg-amber-800",
					)}
					asChild
				>
					<Link to="/register">
						{t(($) => $.demo.navigate.toRegister)}
					</Link>
				</Button>
			</div>
		</div>
	);
};
