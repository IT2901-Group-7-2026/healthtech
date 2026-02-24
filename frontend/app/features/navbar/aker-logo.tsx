import { useIsMobile } from "@/hooks/use-mobile.js";
import { useTheme } from "../dark-mode/use-theme.js";

export const AkerLogo = ({
	sizeOverride,
}: {
	sizeOverride?: "small" | "large";
}) => {
	const { theme } = useTheme();
	const isMobile = useIsMobile();
	const resolvedTheme: "light" | "dark" =
		theme === "system"
			? document.documentElement.classList.contains("dark")
				? "dark"
				: "light"
			: theme;
	const isDark = resolvedTheme === "dark";
	let size: "small" | "large";
	if (sizeOverride) {
		size = sizeOverride;
	} else {
		size = isMobile ? "small" : "large";
	}
	return (
		<img
			height={300}
			width={isMobile ? 300 : 1025}
			alt="Aker Solutions Logo"
			src={`/akerlogo_${size}${isDark ? "_dark" : ""}.png`}
		/>
	);
};
