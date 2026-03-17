import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserWithStatusDto } from "@/lib/dto";
import L, { type LatLngBoundsExpression, type PathOptions } from "leaflet";
import { Fragment, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { ImageOverlay, MapContainer, Marker, Polygon } from "react-leaflet";
import { HallOperatorList } from "./hall-operator-list";
import { MapUsersBadge } from "./location-map-users-badge";
import { getCenterPoint, xyToyx } from "./location-map-utils";
import { useImageSize } from "./use-image-size";

type Hall = {
	name: string;
	positions: Array<[number, number]>;
	baseStyle: PathOptions;
	hoverStyle: PathOptions;
	selectedStyle: PathOptions;
	operators: Array<UserWithStatusDto>;
};

type LocationMapProps = {
	operators: Array<UserWithStatusDto>;
	imageUrl?: string;
	isLoading?: boolean;
};

export function LocationMap({
	operators,
	isLoading,
	imageUrl = "/factory_arial_view.jpg",
}: LocationMapProps) {
	const imageSize = useImageSize(imageUrl);
	const { t } = useTranslation();
	const mapRef = useRef<L.Map | null>(null);

	// TODO: Data for prototype
	const halls: Array<Hall> = [
		{
			name: "M-hallen",
			operators,
			positions: [
				xyToyx(170, 250),
				xyToyx(250, 250),
				xyToyx(250, 70),
				xyToyx(170, 70),
			],
			baseStyle: {
				color: "#2563eb",
				weight: 2,
				opacity: 1,
				fillColor: "#3b82f6",
				fillOpacity: 0.2,
			},
			hoverStyle: {
				color: "#2563eb",
				weight: 2,
				opacity: 1,
				fillColor: "#3b82f6",
				fillOpacity: 0.3,
			},
			selectedStyle: {
				color: "#2563eb",
				weight: 3,
				opacity: 1,
				fillColor: "#3b82f6",
				fillOpacity: 0.3,
			},
		},
	];

	const [selectedHallName, setSelectedHallName] = useState<string | null>(
		halls.length === 1 ? halls[0].name : null,
	);

	const bounds: LatLngBoundsExpression | undefined = imageSize
		? [
				[0, 0],
				[imageSize.height, imageSize.width],
			]
		: undefined;

	if (!(imageSize && bounds)) {
		return (
			<Skeleton
				className="w-full rounded-xl bg-muted"
				style={{ aspectRatio: "16 / 9" }}
			/>
		);
	}

	const onHallCollapsibleOpen = (hallName: string | null) => {
		setSelectedHallName(hallName);

		const hall = halls.find((h) => h.name === hallName);
		if (!hall) {
			return;
		}

		const map = mapRef.current;
		if (!map) {
			return;
		}

		// Move to the selected hall on the map
		const hallBounds = L.latLngBounds(hall.positions);
		map.fitBounds(hallBounds, {
			padding: [20, 20],
			maxZoom: 1,
		});
	};

	const hallOverlayOnClick = (hallName: string) => {
		setSelectedHallName(hallName);
	};

	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
					{t(($) => $.foremanDashboard.siteMap.title)}
				</h2>
			</CardHeader>
			<CardContent
				style={{
					aspectRatio: `${imageSize.width} / ${imageSize.height}`,
				}}
			>
				<div className="flex h-full w-full flex-row gap-4">
					<div className="flex w-2/6 flex-col border-r-2 border-solid pr-2">
						{halls.map((hall) => (
							<HallOperatorList
								key={hall.name}
								operators={hall.operators}
								hallName={hall.name}
								selectedHall={selectedHallName}
								onOpen={onHallCollapsibleOpen}
								isLoading={isLoading}
							/>
						))}
					</div>
					<div className="w-full">
						<MapContainer
							ref={mapRef}
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
								userSelect: "none",
							}}
						>
							<ImageOverlay url={imageUrl} bounds={bounds} />
							{halls.map((hall) => (
								<Fragment key={hall.name}>
									<Polygon
										pathOptions={
											selectedHallName === hall.name
												? hall.selectedStyle
												: hall.baseStyle
										}
										positions={hall.positions}
										eventHandlers={{
											click: () =>
												hallOverlayOnClick(hall.name),
											mouseover: (e) => {
												if (
													selectedHallName !==
													hall.name
												) {
													e.target.setStyle(
														hall.hoverStyle,
													);
												}
											},
											mouseout: (e) => {
												if (
													selectedHallName !==
													hall.name
												) {
													e.target.setStyle(
														hall.baseStyle,
													);
												}
											},
										}}
									/>
									<Marker
										position={getCenterPoint(
											hall.positions,
										)}
										icon={createUsersIcon(
											hall.operators.length,
											"bg-teal-700",
											isLoading,
										)}
										eventHandlers={{
											click: () =>
												hallOverlayOnClick(hall.name),
										}}
									/>
								</Fragment>
							))}
						</MapContainer>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function createUsersIcon(
	count: number,
	badgeBgClassName: string,
	isLoading?: boolean,
) {
	return L.divIcon({
		className: "", // Prevents default Leaflet styling
		html: renderToString(
			<MapUsersBadge
				count={count}
				badgeBgClassName={badgeBgClassName}
				isLoading={isLoading}
			/>,
		),
		iconSize: [60, 32],
	});
}
