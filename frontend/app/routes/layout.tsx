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
import { ModeToggle } from "@/features/dark-mode/mode-toggle";
import { useTheme } from "@/features/dark-mode/use-theme";
import { useDate } from "@/features/date-picker/use-date";
import { Icon, type IconVariant } from "@/features/icon";
import { BellPopup } from "@/features/popups/bell-popup";
import { usePopup } from "@/features/popups/use-popup";
import { ProfileBadge } from "@/features/profile/profile-badge";
import { sensors } from "@/features/sensor-picker/sensors";
import { useSensor } from "@/features/sensor-picker/use-sensor";
import { useUser } from "@/features/user/user-user";
import { useView } from "@/features/views/use-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { usersQueryOptions } from "@/lib/api";
import type { User } from "@/lib/dto.js";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { href, NavLink, Outlet, type To, useLocation } from "react-router";

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
			<span className="hidden text-xl sm:inline-block">{"HealthTech"}</span>
		</NavLink>
	);
}

function getLinks(
	t: ReturnType<typeof useTranslation>["t"],
	role: User["role"],
): Array<{ to: To; label: string }> {
	switch (role) {
		case "operator": {
			return [
				{ to: href("/"), label: t(($) => $.layout.overview) },
				{ to: href("/operator/dust"), label: t(($) => $.dust) },
				{ to: href("/operator/vibration"), label: t(($) => $.vibration) },
				{ to: href("/operator/noise"), label: t(($) => $.noise) },
			];
		}

		case "foreman": {
			return [
				{ to: href("/"), label: t(($) => $.layout.overview) }, //
			];
		}

		default: {
			return [];
		}
	}
}

// biome-ignore lint: page components can be default exports
export default function Layout() {
	const isMobile = useIsMobile();

	const { t, i18n } = useTranslation();
	const { visible, openPopup, closePopup } = usePopup();

	const { user, setUser } = useUser();
	const { data: users } = useQuery(usersQueryOptions());

	const links = getLinks(t, user?.role);

	return (
		<SidebarProvider defaultOpen={false}>
			<SidebarInset>
				<header className="flex items-center justify-between p-2">
					{isMobile ? (
						<div className="flex items-center gap-4">
							<MobileMenu routes={links}>
								<DrawerTrigger>
									<HamburgerButton />
								</DrawerTrigger>
							</MobileMenu>
							<HomeLink />
						</div>
					) : (
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
					)}
					<div className="flex flex-row gap-4">
						<button
							type="button"
							className="hidden cursor-pointer rounded-xl px-1 hover:bg-card active:bg-card md:block"
							onClick={openPopup}
						>
							<Icon variant="bell" size="medium" />
						</button>
						<Select
							onValueChange={(value) => {
								var selectedUser = users?.find((u) => u.id === value);
								if (selectedUser) {
									setUser(selectedUser);
								}
							}}
							value={user?.id}
						>
							<SelectTrigger className="w-32 bg-background dark:bg-background">
								<SelectValue
									placeholder={t(($) => $.overview.userSelectPlaceholder)}
								/>
							</SelectTrigger>
							<SelectContent className="w-32">
								{users?.map((u) => (
									<SelectItem key={u.id} value={u.id}>
										{u.username}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select onValueChange={(value) => i18n.changeLanguage(value)}>
							<SelectTrigger className="w-32 bg-background dark:bg-background">
								<SelectValue placeholder="Language" />
							</SelectTrigger>
							<SelectContent className="w-32">
								<SelectItem key={"en"} value={"en"}>
									{t(($) => $.english)}
								</SelectItem>
								<SelectItem key={"no"} value={"no"}>
									{t(($) => $.norwegian)}
								</SelectItem>
							</SelectContent>
						</Select>
						<ModeToggle />
						<div className="profile-wrapper">
							{/* DUMMY PROFILE DISPLAY */}
							<ProfileBadge
								name={user?.username || "Olav Perator"}
								location="Egersund"
								avatarUrl="/userimage.png"
								jobTitle="Welder"
								jobDescription="Responsible for welding operations on offshore platforms."
							/>
						</div>
					</div>
				</header>
				<BellPopup
					open={visible}
					onClose={closePopup}
					title={t(($) => $.notifications)}
				></BellPopup>
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

function NavTabs({ routes }: { routes: Array<{ label: string; to: To }> }) {
	const { view } = useView();
	const { date } = useDate();
	const location = useLocation();
	const { setSensor } = useSensor();
	const navLinkRefs = useRef<Array<HTMLElement>>([]); // Refs to the nav links
	const [pillWidth, setPillWidth] = useState<number>();
	const [pillLeft, setPillLeft] = useState<number>();

	const activeNavIndex = routes.findIndex(
		(route) => route.to === location.pathname,
	);

	return (
		<div className="flew-row relative mx-auto flex h-11 rounded-full bg-[var(--card)] px-2">
			<span
				className="absolute top-0 bottom-0 z-10 flex overflow-hidden rounded-full py-1.5 transition-all duration-300"
				style={{ left: pillLeft, width: pillWidth }}
			>
				<span className="h-full w-full rounded-full bg-secondary shadow-sm dark:bg-background" />
			</span>
			{routes.map((route, i) => {
				return (
					<NavLink
						to={{
							pathname: route.to.toString(),
							search: `?view=${view}&date=${date.toISOString().split("T")[0]}`,
						}}
						onClick={() =>
							sensors.find(
								(s) => route.to.toString().includes(s) && setSensor(s),
							)
						}
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
						className={({ isActive }) =>
							`${isActive ?? "text-foreground"} z-20 my-auto cursor-pointer select-none rounded-full px-4 text-center font-medium text-muted-foreground text-sm hover:text-foreground`
						}
						prefetch="intent"
					>
						{route.label}
						{/* {i > 0 && (
							<Icon
								className={"ml-1"}
								variant={route.to.toString().replace("/", "") as IconVariant}
								size="small"
							/>
						)} */}
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
	const { setSensor } = useSensor();
	const { visible, openPopup, closePopup } = usePopup();
	const { t } = useTranslation();
	return (
		<div className="md:hidden">
			<Drawer>
				{children}
				<DrawerContent>
					<DrawerHeader />
					<DrawerDescription>
						<div className="flex items-start justify-between p-6">
							<ul className="flex w-full flex-col items-start gap-4 text-center">
								{routes.map((route, i) => (
									<li key={route.to.toString()}>
										<DrawerClose asChild>
											<NavLink
												to={{
													pathname: route.to.toString(),
													search: `?view=${view}&date=${date.toISOString().split("T")[0]}`,
												}}
												onClick={() =>
													sensors.find(
														(s) =>
															route.to.toString().includes(s) && setSensor(s),
													)
												}
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
								))}
								<li className="separator w-full border-t-2 border-t-slate-200 dark:border-t-slate-700"></li>
								<li>
									<DrawerClose asChild>
										<button
											type="button"
											className="w-full cursor-pointer rounded-xl px-1 hover:bg-card active:bg-card"
											onClick={openPopup}
										>
											<span className="text-lg text-primary">
												{t(($) => $.notifications)}
											</span>
											<Icon variant="bell" size="medium" className="ml-2" />
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
				open={visible}
				onClose={closePopup}
				title={t(($) => $.notifications)}
			></BellPopup>
		</div>
	);
}

function HamburgerButton() {
	return (
		<Button variant={"ghost"} size={"icon"}>
			<HamburgerIcon />
		</Button>
	);
}

const HamburgerIcon = ({
	className,
	...props
}: React.SVGAttributes<SVGElement>) => (
	<svg
		className={cn("pointer-events-none scale-250", className)}
		width={16}
		height={16}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<title>{"Menu Icon"}</title>
		<path
			d="M4 12L20 12"
			className="-translate-y-[7px] origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
		/>
		<path
			d="M4 12H20"
			className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
		/>
		<path
			d="M4 12H20"
			className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
		/>
	</svg>
);

const AkerLogo = ({ sizeOverride }: { sizeOverride?: "small" | "large" }) => {
	const { theme } = useTheme();
	const isMobile = useIsMobile();
	const resolvedTheme: "light" | "dark" =
		theme === "system"
			? document.documentElement.classList.contains("dark")
				? "dark"
				: "light"
			: theme;
	const isDark = resolvedTheme === "dark";
	let size: "small" | "large";
	if (sizeOverride) {
		size = sizeOverride;
	} else {
		size = isMobile ? "small" : "large";
	}
	return (
		<img
			height={300}
			width={isMobile ? 300 : 1025}
			alt="Aker Solutions Logo"
			src={`/akerlogo_${size}${isDark ? "_dark" : ""}.png`}
		/>
	);
};
