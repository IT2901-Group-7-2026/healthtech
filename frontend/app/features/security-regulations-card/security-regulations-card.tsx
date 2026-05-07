import { Card, CardContent, CardLabelHeader } from "@/components/ui/card.tsx";
import { getSecurityRegulations } from "@/lib/security-regulations.ts";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SecurityRegulationsCard = () => {
	const { t } = useTranslation();
	const regulations = getSecurityRegulations(t);

	return (
		<Card muted={true} variant="labeled" className="max-h-96 w-full overflow-y-auto">
			<CardLabelHeader>
				<ShieldCheckIcon className="size-4 shrink-0" />
				<h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					{t(($) => $.securityRegulationsCard.title)}
				</h2>
			</CardLabelHeader>

			<CardContent>
				<ul className="space-y-3">
					{regulations.map(({ icon: Icon, label }) => (
						<li key={label} className="flex items-center gap-3">
							<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span>{label}</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
