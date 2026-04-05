import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// This plugin removes errors when you open Chrome DevTools, where it automatically requests
// `/.well-known/appspecific/com.chrome.devtools.json` to see if your app has custom DevTools workspace settings.
// Because this file doesn't exist, Vite passes the request to React Router. React Router realizes there is no route for
// this URL and throws a giant, noisy 404 error in your terminal.
const silenceChromeDevtools = (): PluginOption => ({
	name: "silence-chrome-devtools",
	configureServer(server) {
		server.middlewares.use((request, response, next) => {
			if (request.url === "/.well-known/appspecific/com.chrome.devtools.json") {
				response.statusCode = 404;
				response.end();
				return;
			}
			next();
		});
	},
});

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), silenceChromeDevtools()],
});
