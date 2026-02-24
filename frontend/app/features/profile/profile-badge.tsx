import { Button } from "@/components/ui/button.js";
import type { User } from "@/lib/dto.js";
import { ProfilePopup } from "../popups/profile-popup";
import { usePopup } from "../popups/use-popup";

export type ProfileBadgeProps = {
	user: User;
	avatarUrl: string;
	users?: Array<User>;
	setUser?: (user: User) => void;
};

export const ProfileBadge = ({
	user,
	avatarUrl,
	setUser,
	users,
}: ProfileBadgeProps) => {
	let shorthandName = user.username;
	const names = user.username.trim().split(/\s+/);
	const namesCount = names.length;
	if (namesCount > 1) {
		const firstInitial = names[0][0].toUpperCase();
		const lastname = names[namesCount - 1];
		shorthandName = `${firstInitial}. ${lastname}`;
	}

	const { visible, closePopup, openPopup } = usePopup();

	return (
		<>
			<Button onClick={openPopup} variant="ghost" className="w-56 py-6">
				<div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							height={150}
							width={150}
							alt={user.username}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="size-8 rounded-full bg-card" />
					)}
				</div>

				<div className="min-w-0 grow text-left leading-tight">
					<p className="truncate font-medium">{shorthandName}</p>
					<p className="truncate text-foreground/60 text-xs">
						{user.location.site}
					</p>
				</div>
			</Button>

			<ProfilePopup
				user={user}
				avatarSrc={avatarUrl}
				open={visible}
				onClose={closePopup}
				users={users}
				setUser={setUser}
			/>
		</>
	);
};
