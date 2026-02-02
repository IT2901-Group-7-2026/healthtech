import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { useTranslation } from "react-i18next";
import { BasePopup } from "./base-popup";

export function ProfilePopup({
	name,
	location,
	avatarSrc,
	open,
	onClose,
	children,
}: {
	name: string;
	location: string;
	avatarSrc?: string;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
}) {
	const { t, i18n } = useTranslation();
	const title = t(($) => $.profile.title);

	const tempListOfRegulations = ["Safety boots", "Helmet", "Protective mask"];

	return (
		<BasePopup title={title} open={open} relevantDate={null} onClose={onClose}>
			{children}
			<div className="flex flex-col gap-6 md:px-6 md:pb-2">
				<div className="flex gap-4">
					<div>
						{avatarSrc ? (
							<img
								src={avatarSrc}
								height={150}
								width={150}
								alt={name}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<div className="h-20 w-20 rounded-full bg-blue-900"></div>
						)}
					</div>
					<div className="flex flex-col gap-3 pt-4">
						<div>
							<div className="label text-muted-foreground">
								{t(($) => $.profile.name)}
							</div>
							<h2>{name}</h2>
						</div>
						<div>
							<div className="label text-muted-foreground">
								{t(($) => $.profile.location)}
							</div>
							<h3>{location}</h3>
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
			</div>
		</BasePopup>
	);
}
