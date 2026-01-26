import type { Config } from "@react-router/dev/config";

// biome-ignore lint: default export in config files is fine
export default {
	// Config options...
	// Server-side render by default, to enable SPA mode set this to `false`
	ssr: false,
} satisfies Config;
