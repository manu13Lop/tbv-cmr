"use client"

interface EliminarUsuarioButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function EliminarUsuarioButton({
  children,
  className,
  title,
}: EliminarUsuarioButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) e.preventDefault()
      }}
      title={title}
    >
      {children}
    </button>
  )
}
