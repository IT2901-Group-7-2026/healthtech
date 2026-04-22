export function getMaxPointByValue<T>(data: Array<T>, getValue: (point: T) => number) {
	return data.reduce((currentMax, point) => (getValue(point) > getValue(currentMax) ? point : currentMax), data[0]);
}
