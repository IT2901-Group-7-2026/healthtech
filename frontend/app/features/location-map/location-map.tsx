import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
	dangerlevelStyles,
	getHighestDangerLevel,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.ts";
import { type UserWithStatusDto } from "@/lib/dto.ts";
import L, { type LatLngBoundsExpression, type PathOptions } from "leaflet";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Fragment, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { ImageOverlay, MapContainer, Marker, Polygon } from "react-leaflet";
import { type Sensor, sensors } from "../sensor-picker/sensors.ts";
import {
	HallOperatorList,
	HallOperatorListSkeleton,
} from "./hall-operator-list.tsx";
import { MapUsersBadge } from "./location-map-users-badge.tsx";
import { getCenterPoint, xyToyx } from "./location-map-utils.ts";
import { useImageSize } from "./use-image-size.tsx";

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

	const [sensor, setSensor] = useQueryState(
		"mapSensor",
		parseAsStringLiteral(["all", ...sensors]).withDefault("all"),
	);

	const highestDangerLevel = getHighestDangerLevel(
		operators,
		sensor === "all" ? null : sensor,
	);

	// To avoid combining danger levels from multiple sensors when "all" is selected, we use a default color
	const hallOverlayColor =
		sensor === "all"
			? "var(--color-blue-600)"
			: `var(--${mapDangerLevelToColor(highestDangerLevel)})`;

	const markerColor =
		sensor === "all"
			? "bg-teal-700"
			: dangerlevelStyles[highestDangerLevel].bg;

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
				color: hallOverlayColor,
				weight: 2,
				opacity: 1,
				fillColor: hallOverlayColor,
				fillOpacity: 0.2,
			},
			hoverStyle: {
				color: hallOverlayColor,
				weight: 2,
				opacity: 1,
				fillColor: hallOverlayColor,
				fillOpacity: 0.3,
			},
			selectedStyle: {
				color: hallOverlayColor,
				weight: 3,
				opacity: 1,
				fillColor: hallOverlayColor,
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

	const onHallCollapsibleClick = (hallName: string | null) => {
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
			<CardContent>
				<div className="flex h-full w-full flex-row gap-4">
					<div className="flex w-2/6 flex-col gap-1 border-r-2 border-solid pr-2">
						{isLoading ? (
							<>
								<HallOperatorListSkeleton />
								<HallOperatorListSkeleton />
								<HallOperatorListSkeleton />
								<HallOperatorListSkeleton />
							</>
						) : (
							halls.map((hall) => (
								<HallOperatorList
									key={hall.name}
									sensor={sensor}
									operators={hall.operators}
									hallName={hall.name}
									selectedHall={selectedHallName}
									onOpenChange={onHallCollapsibleClick}
								/>
							))
						)}
					</div>
					<div className="w-full">
						<Tabs
							value={sensor}
							onValueChange={(value) =>
								setSensor(value as Sensor | "all")
							}
							className="mb-4"
						>
							<TabsList variant="line">
								<TabsTrigger value="all">
									{t(($) => $.allSensors)}
								</TabsTrigger>
								{sensors.map((s) => (
									<TabsTrigger key={s} value={s}>
										{t(($) => $[s])}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
						<div
							style={{
								aspectRatio: `${imageSize.width} / ${imageSize.height}`,
							}}
						>
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
													hallOverlayOnClick(
														hall.name,
													),
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
												markerColor,
												isLoading,
											)}
											eventHandlers={{
												click: () =>
													hallOverlayOnClick(
														hall.name,
													),
											}}
										/>
									</Fragment>
								))}
							</MapContainer>
						</div>
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
