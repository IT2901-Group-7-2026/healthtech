import type { Config } from "@react-router/dev/config";

// biome-ignore lint/style/noDefaultExport: default export in config files is fine
export default {
	ssr: false,
} satisfies Config;
