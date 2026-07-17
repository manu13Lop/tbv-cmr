"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/button"

type ColumnDef = {
  header: string
  key: string
}

type ExportPDFButtonProps = {
  filename: string
  title: string
  columns: ColumnDef[]
  rows: Record<string, string | number | null>[]
  subtitle?: string
  label?: string
}

export function ExportPDFButton({
  filename,
  title,
  columns,
  rows,
  subtitle,
  label,
}: ExportPDFButtonProps) {
  const handleExport = async () => {
    const { exportToPDF } = await import("@/lib/export-pdf")
    exportToPDF({ filename, title, columns, rows, subtitle })
  }

  return (
    <Button variant="secondary" onClick={handleExport}>
      <FileText className="size-4" />
      {label || "Exportar PDF"}
    </Button>
  )
}
