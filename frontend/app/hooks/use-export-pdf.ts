import jsPDF from "jspdf";
import { useCallback } from "react";

const SCALE = 2;

const inlineSvgColors = (svg: SVGSVGElement) => {
	const rootStyles = getComputedStyle(document.documentElement);

	const resolveColor = (value: string) => {
		if (!value.startsWith("var(")) return value;
		const varName = value.replace(/var\((--.*?)\)/, "$1");
		return rootStyles.getPropertyValue(varName).trim() || value;
	};

	svg.querySelectorAll("*").forEach((el) => {
		const fill = el.getAttribute("fill");
		const stroke = el.getAttribute("stroke");
		const stopColor = el.getAttribute("stop-color");

		if (fill) el.setAttribute("fill", resolveColor(fill));
		if (stroke) el.setAttribute("stroke", resolveColor(stroke));
		if (stopColor) el.setAttribute("stop-color", resolveColor(stopColor));
	});
};

const svgToCanvas = async (svg: SVGSVGElement) => {
	const clone = svg.cloneNode(true) as SVGSVGElement;
	inlineSvgColors(clone);

	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(clone);

	const blob = new Blob([svgString], {
		type: "image/svg+xml;charset=utf-8",
	});

	const url = URL.createObjectURL(blob);

	const img = new Image();
	img.src = url;

	await img.decode();

	const rect = svg.getBoundingClientRect();

	const canvas = document.createElement("canvas");
	canvas.width = rect.width * SCALE;
	canvas.height = rect.height * SCALE;

	const ctx = canvas.getContext("2d");
	if (!ctx) return null;

	ctx.scale(SCALE, SCALE);
	ctx.drawImage(img, 0, 0);

	URL.revokeObjectURL(url);

	return canvas;
};

const elementToCanvas = async (elementId: string) => {
	const container = document.getElementById(elementId);
	if (!container) return null;

	const svg = container.querySelector("svg");
	if (!svg) return null;

	return svgToCanvas(svg);
};

export const useExportPDF = () => {
	const exportToPDF = useCallback(async (elementId: string, fileName: string, title: string) => {
		const canvas = await elementToCanvas(elementId);
		if (!canvas) return;

		const titleHeight = 40;

		const pdf = new jsPDF({
			orientation: canvas.width > canvas.height ? "landscape" : "portrait",
			unit: "px",
			format: [canvas.width, canvas.height + titleHeight],
		});

		pdf.setFont("helvetica", "bold");
		pdf.setFontSize(20);

		pdf.text(title, canvas.width / 2, 25, {
			align: "center",
		});

		const imgData = canvas.toDataURL("image/png", 1.0);

		pdf.addImage(imgData, "PNG", 0, titleHeight, canvas.width, canvas.height);

		pdf.save(`${fileName}.pdf`);
	}, []);

	const exportMultipleToPDF = useCallback(
		async (elementIds: Array<string>, fileName: string, titles: Array<string>) => {
			let pdf: jsPDF | null = null;

			const titleHeight = 40;

			for (let i = 0; i < elementIds.length; i++) {
				const canvas = await elementToCanvas(elementIds[i]);
				if (!canvas) continue;

				const imgData = canvas.toDataURL("image/png", 1.0);

				if (pdf) {
					pdf.addPage([canvas.width, canvas.height + titleHeight]);
				} else {
					pdf = new jsPDF({
						orientation: canvas.width > canvas.height ? "landscape" : "portrait",
						unit: "px",
						format: [canvas.width, canvas.height + titleHeight],
					});
				}

				pdf.setFont("helvetica", "bold");
				pdf.setFontSize(20);

				pdf.text(titles[i], canvas.width / 2, 25, {
					align: "center",
				});

				pdf.addImage(imgData, "PNG", 0, titleHeight, canvas.width, canvas.height);
			}

			pdf?.save(`${fileName}.pdf`);
		},
		[],
	);

	return { exportToPDF, exportMultipleToPDF };
};
