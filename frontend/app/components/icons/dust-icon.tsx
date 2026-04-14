import { useTranslation } from "react-i18next";
import type { IconProps } from "./sensor-icons";

export function DustIcon({ className, size = 24, strokeWidth = 2, title, ...props }: IconProps) {
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
			<title>{title || t(($) => $.sensors.dust)}</title>
			<path d="M8.91235 18.3208C7.60953 17.9472 6.50848 17.0714 5.85141 15.886C5.19433 14.7006 5.03507 13.3028 5.40864 11.9999" />
			<path d="M18.9541 16.0425C18.6776 17.6103 17.7897 19.0042 16.4855 19.9173C15.1814 20.8305 13.5679 21.1882 12.0001 20.9117" />
			<path
				d="M16 11C16.5523 11 17 10.5523 17 10C17 9.44772 16.5523 9 16 9C15.4477 9 15 9.44772 15 10C15 10.5523 15.4477 11 16 11Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M19 4C19.5523 4 20 3.55228 20 3C20 2.44772 19.5523 2 19 2C18.4477 2 18 2.44772 18 3C18 3.55228 18.4477 4 19 4Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M15 16C15.5523 16 16 15.5523 16 15C16 14.4477 15.5523 14 15 14C14.4477 14 14 14.4477 14 15C14 15.5523 14.4477 16 15 16Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M2 9C2.55228 9 3 8.55228 3 8C3 7.44772 2.55228 7 2 7C1.44772 7 1 7.44772 1 8C1 8.55228 1.44772 9 2 9Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M21 21C21.5523 21 22 20.5523 22 20C22 19.4477 21.5523 19 21 19C20.4477 19 20 19.4477 20 20C20 20.5523 20.4477 21 21 21Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M10 9C10.5523 9 11 8.55228 11 8C11 7.44772 10.5523 7 10 7C9.44772 7 9 7.44772 9 8C9 8.55228 9.44772 9 10 9Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M10 15C10.5523 15 11 14.5523 11 14C11 13.4477 10.5523 13 10 13C9.44772 13 9 13.4477 9 14C9 14.5523 9.44772 15 10 15Z"
				fill="currentColor"
				stroke="none"
			/>
			<path
				d="M4 21C4.55228 21 5 20.5523 5 20C5 19.4477 4.55228 19 4 19C3.44772 19 3 19.4477 3 20C3 20.5523 3.44772 21 4 21Z"
				fill="currentColor"
				stroke="none"
			/>
			<path d="M5 6.29541C5.20088 5.15615 5.84611 4.14334 6.79374 3.47981C7.74136 2.81627 8.91377 2.55636 10.053 2.75724" />
			<path d="M15 5C16.5913 5 18.1174 5.63214 19.2426 6.75736C20.3679 7.88258 21 9.4087 21 11" />
		</svg>
	);
}

DustIcon.displayName = "DustIcon";
