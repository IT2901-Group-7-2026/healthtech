import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeSwitch } from "@/features/dark-mode/theme-switch.js";
import { useDate } from "@/features/date-picker/use-date";
import { Icon, type IconVariant } from "@/features/icon";
import { AkerLogo } from "@/features/navbar/aker-logo.js";
import { DemoUserSwitchBanner } from "@/features/navbar/demo-user-switch-banner.js";
import { HamburgerButton } from "@/features/navbar/hamburger-icon.js";
import { LanguageSelect } from "@/features/navbar/language-select.js";
import { BellPopup } from "@/features/popups/bell-popup";
import { usePopup } from "@/features/popups/use-popup";
import { ProfileBadge } from "@/features/profile/profile-badge";
import {
	KARI_NORDMANN_ID,
	OLA_NORDMANN_ID,
	useUser,
} from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TranslateFn } from "@/i18n/config.js";
import { usersQueryOptions } from "@/lib/api";
import type { User } from "@/lib/dto.js";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Bell, House, User as UserIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	href,
	NavLink,
	Outlet,
	type To,
	useLocation,
	useNavigate,
} from "react-router";

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

// biome-ignore lint/style/noDefaultExport: react router needs default export
export default function Layout() {
	const isMobile = useIsMobile();

	const { t, i18n } = useTranslation();
	const {
		visible: notificationPopupVisible,
		openPopup: openNotificationPopup,
		closePopup: closeNotificationPopup,
	} = usePopup();

	const { user, setUser } = useUser();
	const { data: users } = useQuery(usersQueryOptions());

	// Sort Ola and Kari to the top, as they are the main demo users
	const priorityUserIds: Array<string> = [OLA_NORDMANN_ID, KARI_NORDMANN_ID];

	const sortedUsers = (users ?? []).toSorted((a, b) => {
		const aPriority = priorityUserIds.indexOf(a.id);
		const bPriority = priorityUserIds.indexOf(b.id);

		if (aPriority === -1 && bPriority === -1) {
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
		if (!user?.role) {
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
	}, [user?.role, location.pathname, navigate]);

	const mobileHeader = (
		<div className="flex items-center gap-4">
			<MobileMenu routes={links}>
				<DrawerTrigger asChild>
					<HamburgerButton />
				</DrawerTrigger>
			</MobileMenu>
			<HomeLink />
		</div>
	);

	const desktopHeader = (
		<>
			<div className="flex items-center gap-4">
				<div className="w-36 shrink-0 border-r-2 border-r-muted-foreground pr-4">
					<AkerLogo />
				</div>
				<HomeLink />
			</div>

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
					t={t}
				/>

				<header className="flex items-center justify-between p-2">
					{isMobile ? mobileHeader : desktopHeader}

					<div className="flex flex-row items-center gap-2">
						<LanguageSelect i18n={i18n} t={t} />

						<ThemeSwitch />

						<Button
							variant="ghost"
							size="icon"
							onClick={openNotificationPopup}
						>
							<Bell className="size-[1.2rem]" />
						</Button>

						{user && (
							<div className="profile-wrapper">
								<ProfileBadge
									user={user}
									avatarUrl="/userimage.png"
									users={sortedUsers}
									setUser={setUser}
								/>
							</div>
						)}
					</div>
				</header>

				<BellPopup
					open={notificationPopupVisible}
					onClose={closeNotificationPopup}
					title={t(($) => $.notifications)}
				/>

				<main className="m-2 flex-col items-center justify-center">
					<Outlet />
					{isMobile && (
						<div className="mt-2 flex w-full justify-center p-4">
							<div className="w-28 shrink-0 self-center">
								<AkerLogo sizeOverride="large" />
							</div>
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
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

	const navLinkRefs = useRef<Array<HTMLElement>>([]); // Refs to the nav links
	const [pillWidth, setPillWidth] = useState<number>();
	const [pillLeft, setPillLeft] = useState<number>();

	const activeNavIndex = routes.findIndex(
		(route) => route.to === location.pathname,
	);

	return (
		<div className="relative mx-auto flex h-11 flex-row rounded-full bg-[var(--card)] px-2">
			<span
				className="absolute top-0 bottom-0 z-10 flex overflow-hidden rounded-full py-1.5 transition-all duration-300"
				style={{ left: pillLeft, width: pillWidth }}
			>
				<span className="h-full w-full rounded-full bg-secondary shadow-sm dark:bg-background" />
			</span>
			{routes.map((route, i) => {
				const className = ({ isActive }: { isActive: boolean }) =>
					cn(
						"z-20 my-auto cursor-pointer select-none rounded-full px-4",
						"text-center font-medium text-muted-foreground text-sm hover:text-foreground",
						isActive && "text-foreground",
					);

				return (
					<NavLink
						to={{
							pathname: route.to.toString(),
							search: `?view=${view}&date=${date.toISOString().split("T")[0]}`,
						}}
						key={route.to.toString()}
						ref={(el) => {
							if (!el) return;

							// Add the ref to the array
							navLinkRefs.current[i] = el;
							// If the current link is the active one, set the pill width and left offset
							if (i === activeNavIndex) {
								setPillWidth(el.offsetWidth);
								setPillLeft(el.offsetLeft);
							}
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

function MobileMenu({
	routes,
	children,
}: {
	routes: Array<{ label: string; to: To }>;
	children?: ReactNode;
}) {
	const { view } = useView();
	const { date } = useDate();
	const {
		visible: notificationPopupVisible,
		openPopup: openNotificationPopup,
		closePopup: closeNotificationPopup,
	} = usePopup();
	const { t } = useTranslation();

	const ContextMenuNavLinks = routes.map((route, i) => (
		<li key={route.to.toString()}>
			<DrawerClose asChild>
				<NavLink
					to={{
						pathname: route.to.toString(),
						search: `?view=${view}&date=${date.toISOString().split("T")[0]}`,
					}}
					key={route.to.toString()}
					prefetch="intent"
					className="text-lg text-primary"
				>
					{route.label}
					{i > 0 && (
						<Icon
							variant={
								route.to
									.toString()
									.replace("/", "") as IconVariant
							}
							size="medium"
							className="ml-2"
						/>
					)}
				</NavLink>
			</DrawerClose>
		</li>
	));

	return (
		<div className="md:hidden">
			<Drawer>
				{children}
				<DrawerContent>
					<DrawerHeader />
					<DrawerDescription>
						<div className="flex items-start justify-between p-6">
							<ul className="flex w-full flex-col items-start gap-4 text-center">
								{ContextMenuNavLinks}
								<li className="separator w-full border-t-2 border-t-slate-200 dark:border-t-slate-700" />
								<li>
									<DrawerClose asChild>
										<button
											type="button"
											className="w-full cursor-pointer rounded-xl px-1 hover:bg-card active:bg-card"
											onClick={openNotificationPopup}
										>
											<span className="text-lg text-primary">
												{t(($) => $.notifications)}
											</span>
											<Icon
												variant="bell"
												size="small"
												className="ml-2"
											/>
										</button>
									</DrawerClose>
								</li>
							</ul>
						</div>
					</DrawerDescription>
					<DrawerFooter>
						<DrawerClose>
							<Button variant="outline">{"Close"}</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			<BellPopup
				open={notificationPopupVisible}
				onClose={closeNotificationPopup}
				title={t(($) => $.notifications)}
			></BellPopup>
		</div>
	);
}
