import { createClient } from "@/lib/supabase-server"
import Link from "next/link"
import { Button } from "@/components/button"
import { Plus, ArrowLeft } from "lucide-react"
import { getUsuarioActual, tienePermiso } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"

const CATEGORIAS = [
  { value: "todos", label: "Todos" },
  { value: "táctico", label: "Tácticos" },
  { value: "técnica_individual", label: "Técnica Individual" },
  { value: "portero", label: "Porteros" },
  { value: "físico", label: "Físicos" },
]

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const usuario = await getUsuarioActual()
  if (!usuario || !tienePermiso(usuario.permisos, "equipos.leer")) {
    redirect("/")
  }

  const puedeEditar = tienePermiso(usuario.permisos, "equipos.editar")
  const params = await searchParams
  const categoriaFiltro = params.categoria ?? "todos"

  const supabase = await createClient()

  let query = supabase
    .from("ejercicios")
    .select("id, categoria, titulo, descripcion, imagen_url, objetivo_principal, created_at, entrenadores ( nombre, apellidos )")
    .order("created_at", { ascending: false })

  if (categoriaFiltro !== "todos") {
    query = query.eq("categoria", categoriaFiltro)
  }

  const { data: ejercicios } = await query

  return (
    <div className="p-6">
      <Link
        href="/entrenadores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a entrenadores
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Biblioteca de Ejercicios</h1>
          <p className="text-sm text-muted-foreground">
            {ejercicios?.length ?? 0} ejercicios en la biblioteca compartida
          </p>
        </div>
        {puedeEditar && (
          <Link href="/entrenadores/ejercicios/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo ejercicio
            </Button>
          </Link>
        )}
      </div>

      {/* Filtro por categoría */}
      <div className="mb-6 flex gap-2">
        {CATEGORIAS.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value === "todos" ? "/entrenadores/ejercicios" : `/entrenadores/ejercicios?categoria=${cat.value}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaFiltro === cat.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {!ejercicios || ejercicios.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No hay ejercicios{categoriaFiltro !== "todos" ? " en esta categoría" : ""}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ejercicios.map((ej) => {
            const autor = ej.entrenadores as any
            return (
              <Link
                key={ej.id}
                href={`/entrenadores/ejercicios/${ej.id}`}
                className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/50"
              >
                {ej.imagen_url ? (
                  <img
                    src={ej.imagen_url}
                    alt={ej.titulo}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                    Sin imagen
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">{ej.titulo}</h3>
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs capitalize text-secondary">
                      {ej.categoria.replace("_", " ")}
                    </span>
                  </div>
                  {ej.objetivo_principal && (
                    <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                      {ej.objetivo_principal}
                    </p>
                  )}
                  {autor && (
                    <p className="text-xs text-muted-foreground">
                      Creado por {autor.nombre} {autor.apellidos}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
