import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useTheme } from "@/features/dark-mode/use-theme";
import { useDate } from "@/features/date-picker/use-date";
import { DemoUserSwitchBanner } from "@/features/navbar/demo-user-switch-banner.js";
import { BellPopup } from "@/features/popups/bell-popup";
import { ProfilePopup } from "@/features/popups/profile-popup";
import { usePopup } from "@/features/popups/use-popup";
import { useUser } from "@/features/user/user-context";
import { KARI_NORDMANN_ID, OLA_NORDMANN_ID } from "@/features/user/user-utils";
import { useView } from "@/features/views/use-view";
import type { TranslateFn } from "@/i18n/config.js";
import { usersQueryOptions } from "@/lib/api";
import type { User } from "@/lib/dto.js";
import { cn, shorthandName } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
	Bell,
	House,
	Languages,
	type LucideIcon,
	Monitor,
	Moon,
	Palette,
	Sun,
	User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	href,
	NavLink,
	Outlet,
	type To,
	useLocation,
	useNavigate,
} from "react-router";
import "leaflet/dist/leaflet.css";

const Logo = () => (
	<svg
		width="44"
		height="40"
		viewBox="0 0 44 40"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>{"HealthTech Logo"}</title>
		<path
			d="M42.8334 20H34.5001L28.2501 38.75L15.7501 1.25L9.50008 20H1.16675"
			stroke="#A4D4DB"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

function HomeLink() {
	return (
		<NavLink
			to={href("/")}
			className="flex cursor-pointer items-center space-x-2 text-foreground transition-colors hover:text-primary/90"
		>
			<div className="text-2xl">
				<Logo />
			</div>
			<span className="hidden text-xl sm:inline-block">
				{"HealthTech"}
			</span>
		</NavLink>
	);
}

function getLinks(
	t: TranslateFn,
	role: User["role"] | null,
): Array<{ to: To; label: string; icon?: LucideIcon }> {
	switch (role) {
		case null: {
			return [];
		}

		case "operator": {
			return [
				{ to: href("/operator"), label: t(($) => $.layout.overview) },
				{ to: href("/operator/dust"), label: t(($) => $.dust) },
				{
					to: href("/operator/vibration"),
					label: t(($) => $.vibration),
				},
				{ to: href("/operator/noise"), label: t(($) => $.noise) },
			];
		}

		case "foreman": {
			return [
				{
					to: href("/foreman"),
					label: t(($) => $.layout.home),
					icon: House,
				},
				{
					to: href("/foreman/team"),
					label: t(($) => $.layout.team),
					icon: UserIcon,
				},
			];
		}

		default: {
			return [];
		}
	}
}

export default function Layout() {
	const { t, i18n } = useTranslation();
	const {
		visible: notificationPopupVisible,
		openPopup: openNotificationPopup,
		closePopup: closeNotificationPopup,
	} = usePopup();

	const { user, setUser, isLoading: isUserLoading } = useUser();
	const { data: users } = useQuery(usersQueryOptions());

	// Sort Ola and Kari to the top, as they are the main demo users
	const priorityUserIds: Array<string> = [OLA_NORDMANN_ID, KARI_NORDMANN_ID];

	const sortedUsers = (users ?? []).toSorted((a, b) => {
		const aPriority = priorityUserIds.indexOf(a.id);
		const bPriority = priorityUserIds.indexOf(b.id);

		if (aPriority === bPriority) {
			return a.username.localeCompare(b.username);
		}

		if (aPriority === -1) {
			return 1;
		}

		if (bPriority === -1) {
			return -1;
		}

		return aPriority - bPriority;
	});

	const links = getLinks(t, user?.role ?? null);

	const location = useLocation();
	const navigate = useNavigate();
	// Redirect users to the appropriate base route if they try to access a route that doesn't match their role
	useEffect(() => {
		if (!user?.role || isUserLoading) {
			return;
		}

		const pathname = location.pathname;

		const isOperatorRoute = pathname.startsWith("/operator");
		const isForemanRoute = pathname.startsWith("/foreman");

		if (user.role === "operator" && isForemanRoute) {
			navigate("/operator", { replace: true });
		}

		if (user.role === "foreman" && isOperatorRoute) {
			navigate("/foreman", { replace: true });
		}
	}, [user?.role, location.pathname, navigate, isUserLoading]);

	const desktopHeader = (
		<>
			<HomeLink />

			<nav className="flex list-none items-center rounded-full">
				<NavTabs routes={links} />
			</nav>
		</>
	);

	return (
		<SidebarProvider defaultOpen={false}>
			<SidebarInset>
				<DemoUserSwitchBanner
					user={user}
					users={sortedUsers}
					setUser={setUser}
				/>

				<header className="mx-5 my-2 flex items-center justify-between">
					{desktopHeader}

					<div className="flex flex-row items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={openNotificationPopup}
							className="cursor-pointer rounded-full"
						>
							<Bell className="size-5" />
						</Button>

						<UserDropdown
							user={user}
							users={sortedUsers}
							setUser={setUser}
							i18n={i18n}
						/>
					</div>
				</header>

				<BellPopup
					open={notificationPopupVisible}
					onClose={closeNotificationPopup}
					title={t(($) => $.notifications)}
				/>

				<main className="m-5 items-center justify-center">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function UserDropdown({
	user,
	users,
	setUser,
	i18n,
}: {
	user: User | null;
	users: Array<User>;
	setUser: (user: User) => void;
	i18n: ReturnType<typeof useTranslation>["i18n"];
}) {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();
	const { visible, openPopup, closePopup } = usePopup();

	if (!user) return null;

	const currentLanguage = i18n.language || "en";

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="h-10 max-w-[14rem] cursor-pointer gap-2 rounded-full pr-3 pl-0"
					>
						<div className="flex size-9 items-center justify-center rounded-full bg-primary">
							<UserIcon className="size-5 text-primary-foreground" />
						</div>
						<div className="min-w-0 grow text-left leading-tight">
							<p className="truncate font-medium">
								{shorthandName(user.username)}
							</p>
							<p className="truncate text-foreground/60 text-xs">
								{user.location.site}
							</p>
						</div>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="" sideOffset={10}>
					<DropdownMenuItem onSelect={() => openPopup()}>
						<UserIcon className="size-4" />
						<span>{t(($) => $.profile.title)}</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<div className="flex items-center gap-4 pl-2 text-sm">
						<div className="flex gap-2">
							<Palette className="size-4 text-muted-foreground" />
							<span>{t(($) => $.layout.theme)}</span>
						</div>

						<div className="inline-flex rounded-full p-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setTheme("light")}
								className={cn(
									"inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors",
									theme === "light" && "bg-accent",
								)}
							>
								<Sun className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setTheme("dark")}
								className={cn(
									"inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors",
									theme === "dark" && "bg-accent",
								)}
							>
								<Moon className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setTheme("system")}
								className={cn(
									"inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-colors",
									theme === "system" && "bg-accent",
								)}
							>
								<Monitor className="size-4" />
							</Button>
						</div>
					</div>

					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<Languages className="mr-2 size-4 text-muted-foreground" />
							<span>{t(($) => $.layout.language)}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-44">
							<DropdownMenuRadioGroup
								value={currentLanguage}
								onValueChange={(value) => {
									i18n.changeLanguage(value);
									localStorage.setItem("i18nextLng", value);
								}}
							>
								<DropdownMenuRadioItem value="en">
									{t(($) => $.english)}
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="no">
									{t(($) => $.norwegian)}
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>

			<ProfilePopup
				user={user}
				avatarSrc="/userimage.png"
				open={visible}
				onClose={closePopup}
				users={users}
				setUser={setUser}
			/>
		</>
	);
}

function NavTabs({
	routes,
}: {
	routes: Array<{ label: string; to: To; icon?: LucideIcon }>;
}) {
	const { view } = useView();
	const { date } = useDate();
	const location = useLocation();

	const navLinkRefs = useRef<Array<HTMLElement>>([]);
	const [pillWidth, setPillWidth] = useState<number>();
	const [pillLeft, setPillLeft] = useState<number>();

	const activeNavIndex = routes.findIndex(
		(route) => route.to === location.pathname,
	);

	// update pill whenever the active route changes,
	useEffect(() => {
		const el = navLinkRefs.current[activeNavIndex];
		if (!el) return;
		setPillWidth(el.offsetWidth);
		setPillLeft(el.offsetLeft);
	}, [activeNavIndex]);

	return (
		<div className="relative mx-auto flex h-11 flex-row rounded-full bg-accent px-2 dark:bg-card">
			<div
				className="absolute top-0 bottom-0 z-10 flex overflow-hidden rounded-full py-1.5 transition-all duration-300"
				style={{ left: pillLeft, width: pillWidth }}
			>
				<span className="h-full w-full rounded-full bg-background shadow-sm" />
			</div>

			{routes.map((route, i) => {
				const className = ({ isActive }: { isActive: boolean }) =>
					cn(
						"z-20 my-auto cursor-pointer select-none rounded-full px-4",
						"text-center font-medium text-muted-foreground text-sm hover:text-foreground",
						isActive && "text-foreground",
					);

				return (
					<NavLink
						end
						to={{
							pathname: route.to.toString(),
							search: `?view=${view}&date=${date.toISOString().split("T")[0]}`,
						}}
						key={route.to.toString()}
						ref={(el) => {
							if (!el) return;
							navLinkRefs.current[i] = el;
						}}
						className={className}
						prefetch="intent"
					>
						<span className="inline-flex items-center gap-2.5">
							{route.label}
						</span>
					</NavLink>
				);
			})}
		</div>
	);
}
