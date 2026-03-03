import { useTranslation } from "react-i18next";
import type { User } from "@/lib/dto.js";
import { userRoleToString } from "@/lib/utils.js";
import { BasePopup } from "./base-popup";

interface ProfilePopupProps {
	user: User;
	avatarSrc: string;
	open: boolean;
	onClose: () => void;
	users?: Array<User>;
	setUser?: (user: User) => void;
	children?: React.ReactNode;
}

export function ProfilePopup({
	user,
	open,
	onClose,
	avatarSrc,
	children,
}: ProfilePopupProps) {
	const { t } = useTranslation();
	const title = t(($) => $.profile.title);

	const tempListOfRegulations = ["Safety boots", "Helmet", "Protective mask"];

	return (
		<BasePopup
			title={title}
			open={open}
			relevantDate={null}
			onClose={onClose}
		>
			{children}

			<div className="flex flex-col gap-6 md:px-6 md:pb-2">
				<div className="flex flex-row items-center gap-4">
					<div>
						{avatarSrc ? (
							<img
								src={avatarSrc}
								height={100}
								width={100}
								alt={user.username}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<div className="h-20 w-20 rounded-full bg-blue-900"></div>
						)}
					</div>
					<div className="flex w-full flex-col">
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">
								{t(($) => $.profile.name)}
							</p>
							<h2>{user.username}</h2>
						</div>
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">
								{t(($) => $.profile.location)}
							</p>
							<h3>{user.location.site}</h3>
						</div>
						<div className="flex flex-row gap-3">
							<p className="label text-muted-foreground">
								{t(($) => $.profile.jobTitle)}
							</p>
							<h3>{userRoleToString(user.role, t)}</h3>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h4 className="text-muted-foreground">
						{t(($) => $.profile.secReg)}
					</h4>
					<div className="w-full rounded-lg bg-card-highlight p-2">
						<ul className="ml-5 list-disc">
							{tempListOfRegulations.map((reg) => (
								<li key={reg}>{reg}</li>
							))}
						</ul>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<p className="label text-muted-foreground">
						{t(($) => $.profile.jobDescription)}
					</p>
					<div className="w-full rounded-lg bg-card-highlight p-2">
						<p>{user.jobDescription}</p>
					</div>
				</div>
			</div>
		</BasePopup>
	);
}
