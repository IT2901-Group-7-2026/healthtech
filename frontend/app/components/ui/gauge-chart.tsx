import { ChartContainer } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import type { Sensor } from "app/lib/sensors";

// Convert polar coordinates to cartesian, needed because SVG uses xy but gauges are circular
function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
   const angleInRadians = (Math.PI / 180) * angleInDegrees;
   return {
   	x: cx + radius * Math.cos(angleInRadians),
   	y: cy - radius * Math.sin(angleInRadians),
   };
}

interface GaugeNeedleProps {
	cx: number;
	cy: number;
	angle: number;
	innerOffset: number;
	length: number;
	strokeWidth?: number;
	className?: string;
}

function GaugeNeedle({
   cx,
   cy,
   angle,
   innerOffset,
   length,
   strokeWidth = 4,
   className = "text-foreground",
}: GaugeNeedleProps) {
   const start = polarToCartesian(cx, cy, innerOffset, angle);
   const end = polarToCartesian(cx, cy, length, angle);

   return (
   	<line
   		x1={start.x}
   		y1={start.y}
   		x2={end.x}
   		y2={end.y}
   		stroke="currentColor"
   		className={className}
   		strokeWidth={strokeWidth}
   		strokeLinecap="round"
   	/>
   );
}

interface GaugeOverlayProps {
	cx: number;
	cy: number;
	viewBoxWidth: number;
	viewBoxHeight: number;
	needleAngle: number;
	needleInnerOffset: number;
	needleLength: number;
	needleStrokeWidth?: number;
	value: number;
	unit: string;
}

function GaugeOverlay({
	cx,
	cy,
	viewBoxWidth,
	viewBoxHeight,
	needleAngle,
	needleInnerOffset,
	needleLength,
	needleStrokeWidth = 4,
	value,
	unit,
}: GaugeOverlayProps) {
   return (
   	<svg
   		viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
   		className="pointer-events-none absolute inset-0 h-full w-full"
   	>
   		<GaugeNeedle
   			cx={cx}
   			cy={cy}
   			angle={needleAngle}
   			innerOffset={needleInnerOffset}
   			length={needleLength}
   			strokeWidth={needleStrokeWidth}
   		/>

   		<text
   			x={cx}
   			y={cy - 8}
   			textAnchor="middle"
   			className="fill-current text-[16px] font-bold text-foreground"
   		>
   			{value.toFixed(2)}
   		</text>

   		<text
   			x={cx}
   			y={cy + 12}
   			textAnchor="middle"
   			className="fill-current text-[10px] font-medium text-muted-foreground"
   		>
   			{unit}
   		</text>
   	</svg>
   );
}

interface GaugeChartProps {
   value: number | null;
   thresholdValue: number;
   unit?: string;
   label?: string;
   sensor: Sensor;
}

export function GaugeChart({ value, thresholdValue, unit, label, sensor }: GaugeChartProps) {
   const { t } = useTranslation();
   const resolvedUnit = unit ?? t(($) => $.sensors.dustUnit);
   const resolvedLabel = label ?? t(($) => $.sensors[sensor]);

   // Gauge geometry constants
   const CX = 100;
   const CY = 100;
   const RADIUS = 70;
   const GAUGE_ARC_WIDTH = 18;
   const NEEDLE_INNER_OFFSET = 40;
   const VIEWBOX_HEIGHT = 170;
   const VIEWBOX_WIDTH = 200;

   // Derived radii
   const innerRadius = RADIUS - GAUGE_ARC_WIDTH / 2;
   const outerRadius = RADIUS + GAUGE_ARC_WIDTH / 2;
   const needleLength = RADIUS + 1;

   // Angle configuration
   const START_ANGLE = 180;
   const SWEEP_ANGLE = 180;
   const END_ANGLE = START_ANGLE - SWEEP_ANGLE;

   // Value calculations
   const clampedValue = Math.max(0, Math.min(value ?? 0, thresholdValue));
   const percent = thresholdValue > 0 ? clampedValue / thresholdValue : 0;
   const needleAngle = START_ANGLE - percent * SWEEP_ANGLE;

   return (
   	<Card className="w-fit">
   		<div className="mt-2 w-full text-center text-sm font-medium">
   			{resolvedLabel}
   		</div>
   		{value !== null ? <div className="relative h-[170px] w-[200px]">
   			<ChartContainer config={{}} className="h-full w-full">
   				<PieChart width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT}>
   					<defs>
   						<linearGradient
   							id="gaugeGradient"
   							x1="0%"
   							y1="0%"
   							x2="100%"
   							y2="0%"
   						>
   							<stop offset="0%" stopColor="var(--safe)" />
   							<stop offset="50%" stopColor="var(--warning)" />
   							<stop offset="100%" stopColor="var(--danger)" />
   						</linearGradient>
   					</defs>

   					<Pie
   						data={[{ value: 1 }]}
   						dataKey="value"
   						cx={CX}
   						cy={CY}
   						startAngle={START_ANGLE}
   						endAngle={END_ANGLE}
   						innerRadius={innerRadius}
   						outerRadius={outerRadius}
   						fill="url(#gaugeGradient)"
   					/>
   				</PieChart>
   			</ChartContainer>

   			<GaugeOverlay
   				cx={CX}
   				cy={CY}
   				viewBoxWidth={VIEWBOX_WIDTH}
   				viewBoxHeight={VIEWBOX_HEIGHT}
   				needleAngle={needleAngle}
   				needleInnerOffset={NEEDLE_INNER_OFFSET}
   				needleLength={needleLength}
   				value={clampedValue}
   				unit={resolvedUnit}
   			/>
   		</div>
		: <div className="flex h-[170px] w-[200px] flex-col items-center justify-center gap-1 text-center">
    				<span className="text-sm">{t(($) => $.common.noData)}</span>
   			</div>
		}
   	</Card>
   );
}
