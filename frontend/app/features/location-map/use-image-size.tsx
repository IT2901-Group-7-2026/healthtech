import { useEffect, useState } from "react";

export type ImageSize = {
	height: number;
	width: number;
};

export function useImageSize(imageUrl: string) {
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
