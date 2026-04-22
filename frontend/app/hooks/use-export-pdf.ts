import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { useCallback } from "react";

const elementToCanvas = async (elementId: string) => {
	const container = document.getElementById(elementId);
	if (!container) return null;

	const wrapper = container.querySelector<HTMLElement>(".recharts-wrapper");

	if (!wrapper) return null;

	return toCanvas(wrapper, { skipFonts: true, pixelRatio: 2 });
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
