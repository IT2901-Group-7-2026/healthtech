import type { resources } from "@/i18n/config";

declare module "i18next" {
	// biome-ignore lint: this is how i18next types are extended
	interface CustomTypeOptions {
		resources: (typeof resources)["en"];
		enableSelector: "optimize";
	}
}
