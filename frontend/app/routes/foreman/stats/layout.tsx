import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useDate } from "@/features/date-picker/use-date";
import { useFormatDate } from "@/hooks/use-format-date";
import { getLocale } from "@/i18n/locale";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { href, NavLink, Outlet } from "react-router";

function getLinkClasses(isActive: boolean) {
	return isActive
		? "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
		: "rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
}

const ForemanStatsLayout = () => {
	const { t, i18n } = useTranslation();
	const { date, setDate } = useDate();
	const formatDate = useFormatDate();
	const [open, setOpen] = useState(false);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) return;

		const utcDate = new Date(
			Date.UTC(
				selectedDate.getFullYear(),
				selectedDate.getMonth(),
				selectedDate.getDate(),
			),
		);
		setDate(utcDate);
		setOpen(false);
	};

	return (
		<section className="flex w-full flex-col gap-4">
			<h1 className="p-2 text-3xl">{t(($) => $.layout.statistics)}</h1>
			<div className="flex items-center justify-between gap-2">
				<nav className="flex w-fit gap-2">
					<NavLink
						to={href("/foreman/stats")}
						end
						className={({ isActive }) => getLinkClasses(isActive)}
					>
						{t(($) => $.foremanDashboard.stats.all)}
					</NavLink>
					<NavLink
						to={href("/foreman/stats/dust")}
						className={({ isActive }) => getLinkClasses(isActive)}
					>
						{t(($) => $.foremanDashboard.stats.dust)}
					</NavLink>
					<NavLink
						to={href("/foreman/stats/noise")}
						className={({ isActive }) => getLinkClasses(isActive)}
					>
						{t(($) => $.foremanDashboard.stats.noise)}
					</NavLink>
					<NavLink
						to={href("/foreman/stats/vibration")}
						className={({ isActive }) => getLinkClasses(isActive)}
					>
						{t(($) => $.foremanDashboard.stats.vibration)}
					</NavLink>
				</nav>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline">
							{formatDate(date, "d. MMM yyyy")}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto p-0"
						align="start"
						collisionPadding={8}
					>
						<Calendar
							mode="single"
							selected={date}
							onSelect={handleDateSelect}
							locale={getLocale(i18n.language)}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<Outlet />
		</section>
	);
};

// biome-ignore lint: page components can be default exports
export default ForemanStatsLayout;
