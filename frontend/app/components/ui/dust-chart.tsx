import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface Props {
	value: number | null;
	thresholdValue: number;
	unit?: string;
	label?: string;
}

export function DustChart({ value, thresholdValue, unit, label }: Props) {
	const { t } = useTranslation();
	const resolvedUnit = unit ?? t(($) => $.sensors.dustUnit);
	const resolvedLabel = label ?? t(($) => $.sensors.dust);
	
	if (value === null) {
	return (
		<Card className="w-fit">
		<div className="flex h-[170px] w-[200px] items-center justify-center text-center">
			<p>{t(($) => $.common.noData)}</p>
		</div>
		</Card>
	);
	}

	const min = 0;
	const max = thresholdValue;

	const clampedValue = Math.max(min, Math.min(value ?? 0, max));
	const percent = (clampedValue - min) / (max - min);

	const cx = 100;
	const cy = 100;
	const radius = 70;

	const angle = 180 - percent * 180;

	// Arc path (semi circle)
	const arcPath = `
		M ${cx - radius} ${cy}
		A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}
	`;

	return (
		<Card className="w-fit">
			<div className="h-[170px] w-[200px]">
				<div className="mt-2 text-center text-sm font-medium">
				{resolvedLabel}
				</div>

				<svg className="h-[140px] w-[200px]">
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

				{/* gradient arc */}
				<path
					d={arcPath}
					fill="none"
					stroke="url(#gaugeGradient)"
					strokeWidth="18"
					strokeLinecap="round"
				/>

				<Needle
					cx={cx}
					cy={cy}
					angle={angle}
					innerOffset={40}
					length={radius}
				/>

				{/* value */}
				<text
					x={cx}
					y={92}
					textAnchor="middle"
					className="fill-foreground text-[16px] font-bold"
				>
					{clampedValue.toFixed(2)}
				</text>

				{/* unit */}
				<text
					x={cx}
					y={112}
					textAnchor="middle"
					className="fill-muted-foreground text-[10px]"
				>
					{resolvedUnit}
				</text>
				</svg>
			</div>
		</Card>
	);
}

interface NeedleProps {
  cx: number;
  cy: number;
  angle: number;
  innerOffset: number;
  length: number;
}

export function Needle({
  cx,
  cy,
  angle,
  innerOffset,
  length,
}: NeedleProps) {
  const rad = (Math.PI / 180) * angle;

  const x1 = cx + innerOffset * Math.cos(rad);
  const y1 = cy - innerOffset * Math.sin(rad);

  const x2 = cx + length * Math.cos(rad);
  const y2 = cy - length * Math.sin(rad);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  );
}