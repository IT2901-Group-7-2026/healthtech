import type { resources } from "@/i18n/config";
import type { t } from "i18next";

export type TranslatedString = ReturnType<typeof t>;

declare module "i18next" {
	// biome-ignore lint: this is how i18next types are extended
	interface CustomTypeOptions {
		resources: (typeof resources)["en"];
		enableSelector: "optimize";
	}
}
