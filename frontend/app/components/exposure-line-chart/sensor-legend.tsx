export type SensorLegendItem = {
	label: string;
	color: string;
};

export function SensorLegend({ items }: { items: Array<SensorLegendItem> }) {
	return (
		<div className="flex items-center gap-6 text-muted-foreground text-xs">
			{items.map((item) => (
				<div key={item.label} className="flex items-center gap-2">
					<svg width="24" height="8" className="shrink-0" aria-label={item.label}>
						<title>{item.label}</title>
						<line x1="0" y1="4" x2="24" y2="4" stroke={item.color} strokeWidth="2" />
					</svg>
					<span>{item.label}</span>
				</div>
			))}
		</div>
	);
}
