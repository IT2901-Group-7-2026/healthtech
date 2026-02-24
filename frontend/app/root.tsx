import { ThemeProvider } from "@/features/dark-mode/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { setDefaultOptions } from "date-fns";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useTranslation } from "react-i18next";
import {
	isRouteErrorResponse,
	Links,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { DateProvider } from "./features/date-picker/date-provider";
import { UserProvider } from "./features/user/user-provider.js";
import { ViewProvider } from "./features/views/view-provider";
import "./i18n/config";

setDefaultOptions({ weekStartsOn: 1 }); // Monday

// biome-ignore lint/style/useComponentExportOnlyModules: Route files must export framework-specific functions like links
export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	const { t, i18n } = useTranslation();
	return (
		<html lang={i18n.language} dir={i18n.dir(i18n.language)}>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<title>{t(($) => $.title)}</title>
				<meta name="description" content={t(($) => $.description)} />
				<Links />

				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

const queryClient = new QueryClient();

// biome-ignore lint/style/noDefaultExport: react router needs default export
export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<NuqsAdapter>
					<UserProvider>
						<DateProvider>
							<ViewProvider>
								{import.meta.env.DEV && (
									<ReactQueryDevtools initialIsOpen={false} />
								)}
								<Outlet />
							</ViewProvider>
						</DateProvider>
					</UserProvider>
				</NuqsAdapter>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
