"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"

type DeleteButtonProps = {
  action: (formData: FormData) => Promise<void>
  label?: string
  confirmTitle?: string
  confirmDescription?: string
  className?: string
}

export function DeleteButton({
  action,
  label = "Eliminar",
  confirmTitle = "Confirmar eliminación",
  confirmDescription = "Esta acción no se puede deshacer. ¿Estás segura de que quieres eliminarlo?",
  className,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleConfirm() {
    setPending(true)
    try {
      const formData = new FormData()
      await action(formData)
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
        className={
          className ??
          "inline-flex items-center gap-1 rounded-md border border-destructive px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
        }
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        {label}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pending ? "Eliminando..." : "Eliminar"}
        onConfirm={handleConfirm}
      />
    </>
  )
}
