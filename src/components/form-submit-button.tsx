"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/button"
import { cn } from "@/lib/utils"

interface FormSubmitButtonProps extends React.ComponentProps<typeof Button> {
  loadingText?: string
}

export function FormSubmitButton({
  children,
  loadingText,
  className,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(className, pending && "opacity-70 cursor-not-allowed")}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText || "Enviando..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
