"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "...")[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total)
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total)
  }

  return pages
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number | null
  disabled?: boolean
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()

  if (disabled || page === null) {
    return (
      <span className="inline-flex items-center justify-center rounded-md p-2 text-sm opacity-50 pointer-events-none">
        {children}
      </span>
    )
  }

  const params = new URLSearchParams(searchParams.toString())
  params.set("page", String(page))

  return (
    <Link
      href={`?${params.toString()}`}
      className="inline-flex items-center justify-center rounded-md p-2 text-sm transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  )
}

function PageButton({
  page,
  isActive,
  children,
}: {
  page: number
  isActive: boolean
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  params.set("page", String(page))

  return (
    <Link
      href={`?${params.toString()}`}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 15,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems ?? 0)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems ?? 0)

  return (
    <div className="flex items-center justify-between gap-4 px-2 py-4">
      {totalItems !== undefined && (
        <p className="text-sm text-muted-foreground">
          Mostrando {startItem}–{endItem} de {totalItems}
        </p>
      )}

      <div className="flex items-center gap-1">
        <PageLink page={currentPage - 1} disabled={currentPage === 1}>
          <ChevronLeft className="size-4" />
        </PageLink>

        {pages.map((page, i) =>
          page === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <PageButton key={page} page={page} isActive={page === currentPage}>
              {page}
            </PageButton>
          )
        )}

        <PageLink page={currentPage + 1} disabled={currentPage === totalPages}>
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  )
}
