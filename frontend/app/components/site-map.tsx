import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import L, { type LatLngBoundsExpression } from "leaflet";
import { UserIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
import { useTranslation } from "react-i18next";
import {
	ImageOverlay,
	MapContainer,
	Marker,
	Popup,
	Tooltip,
} from "react-leaflet";
import seedrandom from "seedrandom";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type MapMode = "operator" | "foreman";

type ImageSize = {
	width: number;
	height: number;
};

const PIN_SIZE = 30;
// NOTE: This is only necessary because the example image doesn't have more space outside the boundaries of the relevant zone.
// When we get real images of the aker sites we can remove this.
const PIN_EDGE_PADDING = 130;

/// Generates a deterministic position for a user based on their id for demo purposes
function getPositionFromUserId(
	userId: string,
	width: number,
	height: number,
): [number, number] {
	// Padding to keep the pins inside the edges of the image
	const safeWidth = Math.max(1, width - PIN_EDGE_PADDING * 2);
	const safeHeight = Math.max(1, height - PIN_EDGE_PADDING * 2);

	const rndX = seedrandom(`${userId}-x`);
	const rndY = seedrandom(`${userId}-y`);

	const x = PIN_EDGE_PADDING + rndX() * safeWidth;
	const y = PIN_EDGE_PADDING + rndY() * safeHeight;

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
		<div class="flex h-full w-full items-center justify-center rounded-full border-[3px] border-white shadow-lg bg-${mapDangerLevelToColor(dangerLevel)}">
			${userSvg}
		</div>
	`,
		iconSize: [PIN_SIZE, PIN_SIZE],
		iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
		tooltipAnchor: [0, -(PIN_SIZE / 2)],
		popupAnchor: [0, -(PIN_SIZE / 3)],
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
	const { t } = useTranslation();

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

	if (!(imageSize && bounds)) {
		return (
			<Skeleton
				className="w-full rounded-xl bg-muted"
				style={{ aspectRatio: "16 / 9" }}
			/>
		);
	}

	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
					{t(($) => $.foremanDashboard.siteMap.title)}
				</h2>
			</CardHeader>
			<CardContent
				className="w-full rounded-xl"
				style={{
					aspectRatio: `${imageSize.width} / ${imageSize.height}`,
				}}
			>
				<MapContainer
					crs={L.CRS.Simple}
					bounds={bounds}
					maxBounds={bounds}
					maxBoundsViscosity={1.0}
					minZoom={-1}
					maxZoom={2}
					zoomSnap={0}
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
							<Tooltip direction="top">
								{isUsersAnonymized
									? t(
											($) =>
												$.foremanDashboard.siteMap
													.anonymousOperator,
										)
									: operator.username}
							</Tooltip>

							{isUsersClickable && (
								<Popup>
									<div className="font-semibold">
										{operator.username}
									</div>
									<div>
										{"Status: "}
										{t(($) => $[operator.status.status])}
									</div>
								</Popup>
							)}
						</Marker>
					))}
				</MapContainer>
			</CardContent>
		</Card>
	);
}
