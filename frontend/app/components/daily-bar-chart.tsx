"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { sensors } from "@/features/sensor-picker/sensors";
import type { DangerLevel } from "@/lib/danger-levels";
import type { AllSensors } from "@/lib/dto";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

// the chart data is always the same, we only change the colors based on exposure data
const generateChartData = (): Array<Record<string, Sensor>> =>
	sensors.map((sensor) => ({
		sensor,
		...Object.fromEntries(
			Array.from({ length: 24 }, (_, h) => [h.toString(), 10]),
		),
	}));

function getHourlyDangerLevels(
	data: AllSensors,
): Record<Sensor, Array<DangerLevel | null>> {
	const result = {} as Record<Sensor, Array<DangerLevel | null>>;

	sensors.forEach((sensor) => {
		const hourlyLevels = Array(24).fill(null);

		for (const item of data[sensor].data ?? []) {
			const hour = item.time.getUTCHours();
			hourlyLevels[hour] = item.dangerLevel;
		}

		result[sensor] = hourlyLevels;
	});

	return result;
}

//TODO: Here it says vibration 9-10 is safe, but in vibration week chart it says 9-10 warning. But looking at the vibration day chart, there is a point between 9 and 10 that is above warning level. So maybe the week chart is wrong, or maybe the date timezones again
export function DailyBarChart({
	data,
	chartTitle,
	startHour = 8,
	endHour = 16,
	headerRight,
}: {
	data: AllSensors;
	chartTitle: string;
	startHour?: number;
	endHour?: number;
	headerRight?: React.ReactNode;
}) {
	const { t } = useTranslation();
	const { date } = useDate();
	const navigate = useNavigate();
	const totalHours = endHour - startHour + 1;
	const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);

	const hourlyDangerLevels = getHourlyDangerLevels(data);

	//the default color is var(--card), i.e. same as background
	const chartConfig = Object.fromEntries(
		hours.map((h) => [
			h.toString(),
			{
				label: `${h}:00`,
				color: `var(--card)`,
			},
		]),
	) satisfies ChartConfig;

	const hourKeys = Array.from(
		{ length: endHour - startHour + 1 },
		(_, i) => `${startHour + i}`,
	);
	const domainMax = totalHours * 10;
	const ticks = Array.from({ length: totalHours + 1 }, (_, i) => i * 10);

	function cssVarToRgb(variable: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = value;
  const computed = ctx.fillStyle;

  const match = computed.match(/\d+/g);
  return [
    Number(match?.[0] ?? 0),
    Number(match?.[1] ?? 0),
    Number(match?.[2] ?? 0),
  ];
}

function interpolateColor(value: number) {
  const safe = cssVarToRgb("--safe");
  const warn = cssVarToRgb("--warning");
  const danger = cssVarToRgb("--danger");

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  if (value <= 1) {
    const t = value;
    return `rgb(${lerp(safe[0], warn[0], t)},
                ${lerp(safe[1], warn[1], t)},
                ${lerp(safe[2], warn[2], t)})`;
  }

  const t = value - 1;

  return `rgb(${lerp(warn[0], danger[0], t)},
              ${lerp(warn[1], danger[1], t)},
              ${lerp(warn[2], danger[2], t)})`;
}

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{chartTitle}</CardTitle>
				{headerRight}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart data={generateChartData()} layout="vertical">
						<XAxis
							type="number"
							domain={[0, domainMax]}
							ticks={ticks}
							tickFormatter={(value) =>
								`${startHour + value / 10}:00`
							}
						/>
						<YAxis
							dataKey="sensor"
							type="category"
							tickLine={false}
							axisLine={false}
							width={80}
							tickFormatter={(value) =>
								t(($) => $.overview[value as Sensor])
							}
						/>
						{hourKeys.map((key) => (
							<Bar
								key={key}
								dataKey={key}
								stackId="a"
								// stroke={"var(--muted-foreground)"} // Tailwind + theme aware
								// strokeWidth={1}
								stroke="none"
							>
{generateChartData().map((entry, index) => {
  const sensor = entry.sensor;
  const i = Number(key);
  const levels = hourlyDangerLevels[sensor];

  const dangerValue: Record<string, number> = {
    safe: 0,
    warning: 1,
    danger: 2,
  };

  function getBlendedLevel(
    levels: (DangerLevel | null)[],
    i: number
  ) {
    const neighbors = [
  levels[i - 1],
  levels[i],
  levels[i],
  levels[i],
  levels[i + 1],
]
      .filter(Boolean)
      .map((l) => dangerValue[l as DangerLevel]);

    if (neighbors.length === 0) return null;

    return (
      neighbors.reduce((a, b) => a + b, 0) /
      neighbors.length
    );
  }

  function interpolateColor(value: number) {
    const safe = [34, 197, 94];
    const warn = [245, 158, 11];
    const danger = [239, 68, 68];

    if (value <= 1) {
      const t = value;
      return `rgb(${safe[0] + (warn[0] - safe[0]) * t},
                  ${safe[1] + (warn[1] - safe[1]) * t},
                  ${safe[2] + (warn[2] - safe[2]) * t})`;
    }

    const t = value - 1;

    return `rgb(${warn[0] + (danger[0] - warn[0]) * t},
                ${warn[1] + (danger[1] - warn[1]) * t},
                ${warn[2] + (danger[2] - warn[2]) * t})`;
  }

  let color = chartConfig[key].color;

  const blended = getBlendedLevel(levels, i);

  if (blended !== null) {
    color = interpolateColor(blended);
  }

  if (color === `var(--card)`) {
    return (
      <Cell
        key={`cell-${index}-${key}`}
        fill={color}
      />
    );
  }

  return (
    <Cell
      onClick={() =>
        navigate({
          pathname: entry.sensor,
          search: `?view=Day&date=${
            date.toISOString().split("T")[0]
          }`,
        })
      }
      key={`cell-${index}-${key}`}
      fill={color}
      className="cursor-pointer hover:brightness-90 active:brightness-90"
    />
  );
})}
							</Bar>
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
