import type { User } from "@/lib/dto/user";
import { getSecurityRegulations } from "@/lib/security-regulations.js";
import { userRoleToString } from "@/lib/utils.js";
import { BriefcaseBusiness, MapPin, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BasePopup } from "./base-popup";

interface ProfilePopupProps {
	user: User;
	avatarSrc?: string;
	open: boolean;
	onClose: () => void;
	users?: Array<User>;
	setUser?: (user: User) => void;
	children?: React.ReactNode;
}

export function ProfilePopup({ user, open, onClose, avatarSrc, children }: ProfilePopupProps) {
	const { t } = useTranslation();
	const title = t(($) => $.profile.title);
	const regulations = getSecurityRegulations(t);

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}

			<div className="flex flex-col gap-6 pt-2 text-sm">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
					{avatarSrc ? (
						<img
							src={avatarSrc}
							height={100}
							width={100}
							alt={user.name}
							className="size-20 rounded-full object-cover"
						/>
					) : (
						<div className="flex size-20 items-center justify-center rounded-full bg-primary">
							<UserIcon className="size-9 text-primary-foreground" />
						</div>
					)}

					<div>
						<h2 className="font-semibold text-xl">{user.name}</h2>

						<div className="mt-2 grid grid-cols-[1rem_auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
							<MapPin className="mt-0.5 size-4 text-muted-foreground" />
							<p className="label text-muted-foreground">{t(($) => $.profile.location)}</p>
							<p className="min-w-0 truncate font-medium">{user.location.site}</p>

							<BriefcaseBusiness className="mt-0.5 size-4 text-muted-foreground" />
							<p className="label text-muted-foreground">{t(($) => $.profile.jobTitle)}</p>
							<p className="min-w-0 font-medium">{userRoleToString(user.role, t)}</p>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<h4 className="text-muted-foreground">{t(($) => $.profile.currentSecurityRegulations)}</h4>
					<div className="w-full rounded-xl bg-card-highlight p-3">
						<ul className="space-y-2">
							{regulations.map(({ icon: Icon, label }) => (
								<li key={label} className="flex items-center gap-3">
									<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<span>{label}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<h4 className="text-muted-foreground">{t(($) => $.profile.jobDescription)}</h4>
					<div className="w-full rounded-xl bg-card-highlight p-3">
						<p>{user.jobDescription ?? "-"}</p>
					</div>
				</div>
			</div>
		</BasePopup>
	);
}
