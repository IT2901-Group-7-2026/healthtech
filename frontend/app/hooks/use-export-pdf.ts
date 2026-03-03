import { useCallback } from "react"
import jsPDF from "jspdf"

const SCALE = 2

export const useExportPDF = () => {
  const inlineSvgColors = (svg: SVGSVGElement) => {
    const rootStyles = getComputedStyle(document.documentElement)

    const resolveColor = (value: string) => {
      if (!value.startsWith("var(")) return value
      const varName = value.replace(/var\((--.*?)\)/, "$1")
      return rootStyles.getPropertyValue(varName).trim() || value
    }

    svg.querySelectorAll("*").forEach((el) => {
      const fill = el.getAttribute("fill")
      const stroke = el.getAttribute("stroke")
      const stopColor = el.getAttribute("stop-color")

      if (fill) el.setAttribute("fill", resolveColor(fill))
      if (stroke) el.setAttribute("stroke", resolveColor(stroke))
      if (stopColor) el.setAttribute("stop-color", resolveColor(stopColor))
    })
  }

  const svgToCanvas = async (svg: SVGSVGElement) => {
    const clone = svg.cloneNode(true) as SVGSVGElement
    inlineSvgColors(clone)

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.src = url

    await new Promise((resolve) => (img.onload = resolve))

    const rect = svg.getBoundingClientRect()
    const canvas = document.createElement("canvas")

    canvas.width = rect.width * SCALE
    canvas.height = rect.height * SCALE

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.scale(SCALE, SCALE)
    ctx.drawImage(img, 0, 0)

    URL.revokeObjectURL(url)

    return canvas
  }

  const elementToCanvas = async (elementId: string) => {
    const container = document.getElementById(elementId)
    if (!container) return null

    const svg = container.querySelector("svg")
    if (!svg) return null

    return svgToCanvas(svg)
  }

  const exportToPDF = useCallback(
    async (elementId: string, fileName: string) => {
      const canvas = await elementToCanvas(elementId)
      if (!canvas) return

      const pdf = new jsPDF({
        orientation:
          canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      })

      const imgData = canvas.toDataURL("image/png", 1.0)
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
    },
    []
  )

  const exportMultipleToPDF = async (
    elementIds: string[],
    fileName: string
  ) => {
    let pdf: jsPDF | null = null

    for (const id of elementIds) {
      const canvas = await elementToCanvas(id)
      if (!canvas) continue

      const imgData = canvas.toDataURL("image/png", 1.0)

      if (!pdf) {
        pdf = new jsPDF({
          orientation:
            canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        })
      } else {
        pdf.addPage([canvas.width, canvas.height])
      }

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
    }

    pdf?.save(`${fileName}.pdf`)
  }

  return { exportToPDF, exportMultipleToPDF }
}
