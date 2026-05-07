import type { TranslateFn } from "@/i18n/config.ts";
import { Footprints, HardHat, type LucideIcon, ShieldPlus } from "lucide-react";

export interface SecurityRegulation {
	icon: LucideIcon;
	label: string;
}

export function getSecurityRegulations(t: TranslateFn): Array<SecurityRegulation> {
	return [
		{
			icon: Footprints,
			label: t(($) => $.securityRegulationsCard.safetyBoots),
		},
		{
			icon: HardHat,
			label: t(($) => $.securityRegulationsCard.helmet),
		},
		{
			icon: ShieldPlus,
			label: t(($) => $.securityRegulationsCard.protectiveMask),
		},
	];
}
