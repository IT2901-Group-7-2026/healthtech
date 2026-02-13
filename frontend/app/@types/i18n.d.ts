import type { t } from "i18next";
import type { resources } from "@/i18n/config";

export type TranslatedString = ReturnType<typeof t>;

declare module "i18next" {
	interface CustomTypeOptions {
		resources: (typeof resources)["en"];
		enableSelector: "optimize";
	}
}
