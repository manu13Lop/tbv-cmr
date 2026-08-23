"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"

type ConfirmActionButtonProps = {
  onConfirm: () => Promise<void>
  label: string
  icon?: React.ReactNode
  confirmTitle?: string
  confirmDescription?: string
  className?: string
}

export function ConfirmActionButton({
  onConfirm,
  label,
  icon,
  confirmTitle = "Confirmar acción",
  confirmDescription = "¿Estás segura de que quieres realizar esta acción? Esta acción no se puede deshacer.",
  className,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await onConfirm()
    } catch {
      // redirect() throws, this is expected
    }
    setPending(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={className}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          icon
        )}
        {label}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pending ? "Procesando..." : "Confirmar"}
        onConfirm={handleConfirm}
      />
    </>
  )
}
