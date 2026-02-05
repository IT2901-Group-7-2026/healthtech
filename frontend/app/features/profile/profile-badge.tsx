import { cn } from "@/lib/utils";
import { ProfilePopup } from "../popups/profile-popup";
import { usePopup } from "../popups/use-popup";

export type ProfileBadgeProps = {
	name?: string;
	location?: string;
	avatarUrl?: string;
	jobTitle?: string;
	jobDescription?: string;
};

// Dummy implementation
export const ProfileBadge = ({
	name = "Bruker Brukersen",
	location = "Lokasjon",
	avatarUrl,
	jobTitle,
	jobDescription,
}: ProfileBadgeProps) => {
	let shorthandName = name;
	const names = name.trim().split(/\s+/);
	const namesCount = names.length;
	if (namesCount > 1) {
		const firstInitial = `${names[0][0].toUpperCase()}.`;
		const lastname = names[namesCount - 1];
		shorthandName = `${firstInitial} ${lastname}`;
	}

	const { visible, closePopup, openPopup } = usePopup();

	return (
		<>
			<button
				type="button"
				className={cn(
					"inline-flex items-center gap-2 rounded-full border bg-background py-1 pr-4 pl-1",
					"text-foreground/90 text-sm shadow-sm",
					"cursor-pointer hover:bg-card-highlight",
				)}
				onClick={openPopup}
			>
				<div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							height={150}
							width={150}
							alt={name}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="h-8 w-8 rounded-full bg-card"></div>
					)}
				</div>

				<div className="leading-tight">
					<p className="font-medium">{shorthandName}</p>
					<p className="flex items-center gap-1 text-foreground/60 text-xs">
						{location}
					</p>
				</div>
			</button>
			<ProfilePopup
				open={visible}
				onClose={closePopup}
				name={name}
				location={location}
				avatarSrc={avatarUrl}
				jobTitle={jobTitle}
				jobDescription={jobDescription}
			></ProfilePopup>
		</>
	);
};
