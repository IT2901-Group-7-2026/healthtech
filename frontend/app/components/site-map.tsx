import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import L, { type LatLngBoundsExpression } from "leaflet";
import { UserIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
import {
	ImageOverlay,
	MapContainer,
	Marker,
	Popup,
	Tooltip,
} from "react-leaflet";
import seedrandom from "seedrandom";
import { Skeleton } from "./ui/skeleton";

type MapMode = "operator" | "foreman";

type ImageSize = {
	width: number;
	height: number;
};

const PIN_SIZE = 30;

/// Generates a deterministic position for a user based on their id for demo purposes
function getPositionFromUserId(
	userId: string,
	width: number,
	height: number,
): [number, number] {
	// Padding to keep the pins inside the edges of the image
	const padding = PIN_SIZE;
	const safeWidth = Math.max(1, width - padding * 2);
	const safeHeight = Math.max(1, height - padding * 2);

	const rndX = seedrandom(`${userId}-x`);
	const rndY = seedrandom(`${userId}-y`);

	const x = padding + rndX() * safeWidth;
	const y = padding + rndY() * safeHeight;

	// Leaflet coordinate system is [y, x]
	return [y, x];
}

function getUserIcon(dangerLevel: DangerLevel) {
	const userSvg = renderToString(
		<UserIcon color="white" size={16} strokeWidth={2.5} />,
	);

	return L.divIcon({
		className: "",
		html: `
		<div class="flex h-[${PIN_SIZE}px] w-[${PIN_SIZE}px] items-center justify-center rounded-full border-[3px] border-white shadow-lg bg-${mapDangerLevelToColor(dangerLevel)}">
			${userSvg}
		</div>
	`,
		iconSize: [PIN_SIZE, PIN_SIZE],
		iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
	});
}

function useImageSize(imageUrl: string) {
	const [imageSize, setImageSize] = useState<ImageSize | null>(null);

	useEffect(() => {
		const image = new Image();

		image.onload = () => {
			setImageSize({
				width: image.naturalWidth,
				height: image.naturalHeight,
			});
		};

		image.src = imageUrl;
	}, [imageUrl]);

	return imageSize;
}

type SiteMapProps = {
	mode?: MapMode;
	onUserClick?: (userId: string) => void;
	operators: Array<UserWithStatusDto>;
	imageUrl?: string;
};

export function SiteMap({
	mode = "foreman",
	onUserClick,
	operators,
	imageUrl = "/factory_arial_view.jpg",
}: SiteMapProps) {
	const imageSize = useImageSize(imageUrl);

	const isUsersAnonymized = mode === "operator";
	const isUsersClickable = mode === "foreman";

	const bounds: LatLngBoundsExpression | undefined = imageSize
		? [
				[0, 0],
				[imageSize.height, imageSize.width],
			]
		: undefined;

	const iconsByDangerLevel = useMemo(
		() => ({
			safe: getUserIcon("safe"),
			warning: getUserIcon("warning"),
			danger: getUserIcon("danger"),
		}),
		[],
	);

	if (!imageSize || !bounds) {
		return (
			<Skeleton
				className="w-full rounded-xl bg-muted"
				style={{ aspectRatio: "16 / 9" }}
			/>
		);
	}

	return (
		<div
			className="w-full overflow-hidden rounded-xl"
			style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
		>
			<MapContainer
				crs={L.CRS.Simple}
				bounds={bounds}
				maxBounds={bounds}
				maxBoundsViscosity={1.0}
				minZoom={1}
				maxZoom={2}
				style={{
					height: "100%",
					width: "100%",
					background: "var(--card-background)",
				}}
			>
				<ImageOverlay url={imageUrl} bounds={bounds} />

				{operators.map((operator) => (
					<Marker
						key={operator.id}
						position={getPositionFromUserId(
							operator.id,
							imageSize.width,
							imageSize.height,
						)}
						icon={iconsByDangerLevel[operator.status.status]}
						eventHandlers={{
							click: () => {
								if (isUsersClickable) {
									onUserClick?.(operator.id);
								}
							},
						}}
					>
						<Tooltip direction="top" offset={[0, -(PIN_SIZE / 2)]}>
							{isUsersAnonymized ? "Anonymous operator" : operator.username}
						</Tooltip>

						{isUsersClickable && (
							<Popup>
								<div className="font-bold">{operator.username}</div>
								<div>Status: {operator.status.status}</div>
							</Popup>
						)}
					</Marker>
				))}
			</MapContainer>
		</div>
	);
}
