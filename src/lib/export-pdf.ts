import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type ColumnDef = {
  header: string
  key: string
  width?: number
}

type ExportPDFOptions = {
  filename: string
  title: string
  columns: ColumnDef[]
  rows: Record<string, string | number | null>[]
  subtitle?: string
}

export function exportToPDF({
  filename,
  title,
  columns,
  rows,
  subtitle,
}: ExportPDFOptions) {
  const doc = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // Header bar
  doc.setFillColor(122, 31, 43) // TBV primary color
  doc.rect(0, 0, pageWidth, 28, "F")

  // Club name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("TBV — Triana Balonmano Vivero", margin, 12)

  // Report title
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(title, margin, 20)

  // Date
  const now = new Date()
  const dateStr = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(8)
  doc.text(`Generado el ${dateStr}`, pageWidth - margin, 20, {
    align: "right",
  })

  if (subtitle) {
    doc.setFontSize(9)
    doc.text(subtitle, margin, 25)
  }

  // Table
  const head = [columns.map((c) => c.header)]
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      return val === null || val === undefined ? "-" : String(val)
    })
  )

  autoTable(doc, {
    startY: subtitle ? 32 : 30,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [122, 31, 43],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 245, 240],
    },
    didDrawPage: (data) => {
      // Footer
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `TBV — Triana Balonmano Vivero · Página ${data.pageNumber}`,
        pageWidth / 2,
        pageH - 8,
        { align: "center" }
      )
    },
  })

  doc.save(`${filename}.pdf`)
}
