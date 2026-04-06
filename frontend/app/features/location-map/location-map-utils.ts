export function xyToyx(x: number, y: number): [number, number] {
	return [y, x];
}

export function getCenterPoint(points: Array<[number, number]>): [number, number] {
	const ys = points.map(([y]) => y);
	const xs = points.map(([, x]) => x);

	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);

	return [(minY + maxY) / 2, (minX + maxX) / 2];
}
