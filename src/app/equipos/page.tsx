import { createClient } from "@/lib/supabase-server"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/button"
import { Plus, ArrowLeft } from "lucide-react"
import { PaginationWrapper as Pagination } from "@/components/pagination-wrapper"

export default async function EquiposPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const usuario = await getUsuarioActual()

  if (!usuario || !tienePermiso(usuario.permisos, "equipos.leer")) {
    redirect("/")
  }

  const puedeEditar = tienePermiso(usuario.permisos, "equipos.editar")

  const supabase = await createClient()

  const { data: equipos } = await supabase
    .from("equipos")
    .select("*")
    .order("temporada", { ascending: false })
    .order("nombre", { ascending: true })

  const params = (await searchParams) ?? {}
  const allEquipos = equipos ?? []
  const itemsPerPage = 15
  const totalPages = Math.ceil(allEquipos.length / itemsPerPage)
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages || 1))
  const paginatedEquipos = allEquipos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Equipos</h1>
          <p className="text-sm text-muted-foreground">
            {equipos?.length ?? 0} equipos registrados
          </p>
        </div>
        {puedeEditar && (
          <Link href="/equipos/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo equipo
            </Button>
          </Link>
        )}
      </div>

      {!equipos || equipos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Todavía no hay equipos registrados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Nombre</th>
                <th className="p-3 text-left font-medium">Categoría</th>
                <th className="p-3 text-left font-medium">Temporada</th>
                <th className="p-3 text-left font-medium">Federada</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEquipos.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-border hover:bg-muted/50"
                >
                  <td className="p-3 font-medium">
                    <Link href={`/equipos/${e.id}`} className="hover:underline">
                      {e.nombre}
                    </Link>
                  </td>
                  <td className="p-3">{e.categoria}</td>
                  <td className="p-3">{e.temporada}</td>
                  <td className="p-3">
                    <span
                      className={
                        e.federada ? "text-primary" : "text-muted-foreground"
                      }
                    >
                      {e.federada ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}