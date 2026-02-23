import { cn } from "@/lib/utils";
import bellIconDark from "/icons/bell_dark.png";
import bellIcon from "/icons/bell_light.png";
import dustIconDark from "/icons/dustIcon_dark.png";
import dustIcon from "/icons/dustIcon_light.png";
import noiseIconDark from "/icons/noiseIcon_dark.png";
import noiseIcon from "/icons/noiseIcon_light.png";
import vibrationIconDark from "/icons/vibrationIcon_dark.png";
import vibrationIcon from "/icons/vibrationIcon_light.png";
import type { Theme } from "./dark-mode/theme-context";
import { useTheme } from "./dark-mode/use-theme";

export type IconVariant = "dust" | "noise" | "vibration" | "bell";
type IconSize = "small" | "medium";

type IconProps = {
	variant: IconVariant;
	size: IconSize;
	className?: string;
};

const lightIcons: Record<IconVariant, string> = {
	dust: dustIcon,
	noise: noiseIcon,
	vibration: vibrationIcon,
	bell: bellIcon,
};

const darkIcons: Record<IconVariant, string> = {
	dust: dustIconDark,
	noise: noiseIconDark,
	vibration: vibrationIconDark,
	bell: bellIconDark,
};

const srcMap: Partial<Record<Theme, Record<IconVariant, string>>> = {
	dark: darkIcons,
	light: lightIcons,
};

export function Icon({ variant, size, className }: IconProps) {
	const { theme } = useTheme();
	const isSmall = size === "small";

	const resolvedTheme: "light" | "dark" =
		theme === "system"
			? document.documentElement.classList.contains("dark")
				? "dark"
				: "light"
			: theme;
	const iconSrc = srcMap[resolvedTheme]?.[variant];

	return (
		<img
			src={iconSrc}
			alt={`${variant} icon`}
			width={200}
			height={200}
			className={cn(
				isSmall ? "h-5 w-5" : "h-8 w-8",
				"inline-block align-middle",
				className,
			)}
		/>
	);
}
