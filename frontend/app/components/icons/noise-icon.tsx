import { useTranslation } from "react-i18next";
import type { IconProps } from "./sensor-icons";

export function NoiseIcon({ className, size = 24, strokeWidth = 2, title, ...props }: IconProps) {
	const { t } = useTranslation();

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<title>{title || t(($) => $.sensors.noise)}</title>
			<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
			<path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
		</svg>
	);
}

NoiseIcon.displayName = "NoiseIcon";
