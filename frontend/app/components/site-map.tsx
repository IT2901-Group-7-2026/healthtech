import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import L from "leaflet";
import { UserIcon } from "lucide-react";
import { renderToString } from "react-dom/server";
import {
	ImageOverlay,
	MapContainer,
	Marker,
	Popup,
	Tooltip,
} from "react-leaflet";

type MapMode = "operator" | "foreman";

const bounds: [[number, number], [number, number]] = [
	[0, 0],
	[1000, 1000],
];

function getPositionFromUserId(
	id: string,
	width = 1000,
	height = 1000,
): [number, number] {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}

	const margin = 50;
	const ySeed = Math.abs((hash * 9301 + 49297) % 233280);

	const x = margin + Math.abs(hash % (width - margin * 2));
	const y = margin + Math.abs(ySeed % (height - margin * 2));

	// leaflet uses [y, x]
	return [y, x];
}

function getUserIcon(dangerLevel: DangerLevel) {
	const userSvg = renderToString(
		<UserIcon color="white" size={16} strokeWidth={2.5} />,
	);

	return L.divIcon({
		className: "",
		html: `
		<div class="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-white shadow-lg bg-${mapDangerLevelToColor(dangerLevel)}">
			${userSvg}
		</div>
	`,
		iconSize: [30, 30],
		iconAnchor: [15, 15],
	});
}

type SiteMapProps = {
	mode?: MapMode;
	onUserClick?: (userId: string) => void;
	operators: Array<UserWithStatusDto>;
};

export function SiteMap({
	mode = "foreman",
	onUserClick,
	operators,
}: SiteMapProps) {
	const anonymizeUsers = mode === "operator";
	const isUserClickable = mode === "foreman";

	return (
		<MapContainer
			crs={L.CRS.Simple}
			bounds={bounds}
			maxBounds={bounds}
			maxBoundsViscosity={1.0}
			minZoom={-2}
			maxZoom={2}
			style={{ height: "600px", width: "100%", background: "#0f172a" }}
		>
			<ImageOverlay url="/factory_arial_view.jpg" bounds={bounds} />

			{operators.map((operator) => (
				<Marker
					key={operator.id}
					position={getPositionFromUserId(operator.id)}
					icon={getUserIcon(operator.status.status)}
					eventHandlers={{
						click: () => {
							if (isUserClickable) {
								onUserClick?.(operator.id);
							}
						},
					}}
				>
					<Tooltip direction="top" offset={[0, -12]} opacity={1}>
						{anonymizeUsers ? "Anonymous operator" : operator.username}
					</Tooltip>

					{isUserClickable && (
						<Popup>
							<div>
								<div style={{ fontWeight: 600 }}>{operator.username}</div>
								<div>Status: {operator.status.status}</div>
							</div>
						</Popup>
					)}
				</Marker>
			))}
		</MapContainer>
	);
}
