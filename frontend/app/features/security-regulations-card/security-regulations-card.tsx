import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Footprints, HardHat } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SecurityRegulationsCard = () => {
	const { t } = useTranslation();

	const regulations = [
		{
			icon: Footprints,
			label: t(($) => $.securityRegulationsCard.safetyBoots),
		},
		{
			icon: HardHat,
			label: t(($) => $.securityRegulationsCard.helmet),
		},
	];

	return (
		<Card muted={true} className="max-h-96 w-full overflow-y-auto">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
					{t(($) => $.securityRegulationsCard.title)}
				</h2>
			</CardHeader>

			<CardContent>
				<ul className="space-y-3">
					{regulations.map(({ icon: Icon, label }) => (
						<li key={label} className="flex items-center gap-3">
							<Icon className="text-muted-foreground h-4 w-4 shrink-0" />
							<span>{label}</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
