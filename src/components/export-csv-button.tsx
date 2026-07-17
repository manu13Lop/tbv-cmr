"use client"

import { Download } from "lucide-react"
import { exportToCSV } from "@/lib/export-csv"
import { Button } from "@/components/button"

export function ExportCSVButton({
  filename,
  headers,
  rows,
  label,
}: {
  filename: string
  headers: string[]
  rows: (string | number | null)[][]
  label?: string
}) {
  return (
    <Button
      variant="outline"
      onClick={() => exportToCSV(filename, headers, rows)}
    >
      <Download className="size-4" />
      {label || "Exportar CSV"}
    </Button>
  )
}
