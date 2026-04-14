import { ChartContainer } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface Props {
	value: number | null;
	thresholdValue: number;
	unit?: string;
	label?: string;
}

// NOTE: This is just a proof of concept. The code will be rewritten completely later on.
export function DustChart({ value, thresholdValue, unit, label }: Props) {
	const { t } = useTranslation();
	const resolvedUnit = unit ?? t(($) => $.sensors.dustUnit);
	const resolvedLabel = label ?? t(($) => $.sensors.dust);

	const min = 0;
	const max = thresholdValue;

	const clampedValue = Math.max(min, Math.min(value ?? 0, max));
	const percent = (clampedValue - min) / (max - min);

	const cx = 100;
	const cy = 100;
	const radius = 70;

	const angle = 180 - percent * 180;

	const needleInnerOffset = 52;
	const needleLength = radius + 1;

	const needleRadians = (Math.PI / 180) * angle;

	const x1 = cx + needleInnerOffset * Math.cos(needleRadians);
	const y1 = cy - needleInnerOffset * Math.sin(needleRadians);

	const x2 = cx + needleLength * Math.cos(needleRadians);
	const y2 = cy - needleLength * Math.sin(needleRadians);

	return (
		<Card className="w-fit">
			{value !== null ? <div className="relative h-[170px] w-[200px]">
				<ChartContainer config={{}} className="h-full w-full">
					<PieChart width={200} height={170}>
						<defs>
							<linearGradient
								id="gaugeGradient"
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#67d48b" />
								<stop offset="50%" stopColor="#c9a56a" />
								<stop offset="100%" stopColor="#f35d5d" />
							</linearGradient>
						</defs>

						{/* background track */}
						<Pie
							data={[{ value: 1 }]}
							dataKey="value"
							cx={cx}
							cy={cy}
							startAngle={180}
							endAngle={0}
							innerRadius={61}
							outerRadius={79}
							fill="#3f3f46"
							stroke="none"
							isAnimationActive={false}
						/>

						{/* gradient arc */}
						<Pie
							data={[{ value: 1 }]}
							dataKey="value"
							cx={cx}
							cy={cy}
							startAngle={180}
							endAngle={0}
							innerRadius={61}
							outerRadius={79}
							fill="url(#gaugeGradient)"
							stroke="none"
							isAnimationActive={false}
						/>
					</PieChart>
				</ChartContainer>

				{/* needle + center text */}
				<svg
					viewBox="0 0 200 170"
					className="pointer-events-none absolute inset-0 h-full w-full"
				>
					<line
						x1={x1}
						y1={y1}
						x2={x2}
						y2={y2}
						stroke="currentColor"
						className="text-foreground"
						strokeWidth={4}
						strokeLinecap="round"
					/>

					<text
						x={cx}
						y={92}
						textAnchor="middle"
						className="fill-current text-[16px] font-bold text-foreground"
					>
						{clampedValue.toFixed(2)}
					</text>

					<text
						x={cx}
						y={112}
						textAnchor="middle"
						className="fill-current text-[10px] font-medium text-muted-foreground"
					>
						{resolvedUnit}
					</text>
				</svg>
			</div>
			: <div className="mt-2 w-full text-center text-sm font-medium">
				{resolvedLabel}
			</div>}

			{value === null && <div className="flex items-center text-center h-[170px] w-[200px]"><p>{t(($) => $.common.noData)}</p></div>}
		</Card>
	);
}
