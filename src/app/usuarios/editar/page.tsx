import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft, Save, Key, Shield } from 'lucide-react';
import { actualizarUsuario, resetearPassword, togglePermisoUsuario } from '@/lib/usuarios-actions';
import { getRoles } from '@/lib/roles';

export default async function EditarUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ok?: string; error?: string; msg?: string }>;
}) {
  const { id, ok, error, msg } = await searchParams;

  if (!id) {
    redirect('/usuarios');
  }

  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual || !usuarioActual.esMaster) {
    redirect('/');
  }

  const cookieStore = await cookies();
  const nuevaPassword =
    msg === 'password_reseteado' ? cookieStore.get('reset_password')?.value : null;
  if (nuevaPassword) {
    cookieStore.delete('reset_password');
  }

  const supabase = await createClient();

  const [
    roles,
    { data: usuarioEditar, error: errorUsuario },
    { data: permisos },
    { data: usuarioPermisosRaw },
  ] = await Promise.all([
    getRoles(),
    supabase
      .from('usuarios')
      .select('id, nombre, apellidos, rol_id, es_master')
      .eq('id', id)
      .single(),
    supabase.from('permisos').select('id, nombre, descripcion').order('nombre'),
    supabase.from('usuario_permisos').select('permisos!inner(nombre)').eq('usuario_id', id),
  ]);

  if (errorUsuario || !usuarioEditar) {
    notFound();
  }

  const permisosUsuario: string[] = ((usuarioPermisosRaw ?? []) as Record<string, unknown>[]).map(
    (p) => (p.permisos as Record<string, unknown>)?.nombre as string
  );

  return (
    <div className="p-6">
      <Link
        href="/usuarios"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a Usuarios
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">
        Editar usuario: {usuarioEditar.nombre} {usuarioEditar.apellidos}
      </h1>

      {ok === '1' && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          Usuario actualizado correctamente.
        </div>
      )}
      {msg === 'password_reseteado' && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          <p className="mb-2">Contraseña reseteada correctamente.</p>
          {nuevaPassword ? (
            <div className="flex items-center gap-2">
              <span className="bg-background border-border rounded border px-2 py-1 font-mono text-sm select-all">
                {nuevaPassword}
              </span>
              <span className="text-muted-foreground text-xs">(copia esta contraseña ahora)</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              La contraseña se ha generado. Si no la ves,contacta al administrador del sistema.
            </p>
          )}
        </div>
      )}
      {error === '1' && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          Hubo un error al actualizar el usuario.
        </div>
      )}

      <form
        action={actualizarUsuario.bind(null, id)}
        className="border-border bg-card mb-8 max-w-lg space-y-4 rounded-lg border p-4"
      >
        <p className="flex items-center gap-2 text-sm font-medium">
          <Save className="size-4" />
          Información básica
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              required
              defaultValue={usuarioEditar.nombre}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellidos</label>
            <input
              name="apellidos"
              required
              defaultValue={usuarioEditar.apellidos}
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            defaultValue=""
            className="border-border bg-background w-full rounded-md border p-2 text-sm"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Deja en blanco para no modificar el email
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rol</label>
          <select
            name="rol_id"
            required
            defaultValue={usuarioEditar.rol_id ?? ''}
            className="border-border bg-background w-full rounded-md border p-2 text-sm"
            disabled={usuarioEditar.es_master}
          >
            <option value="">Selecciona un rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          {usuarioEditar.es_master && (
            <p className="text-muted-foreground mt-1 text-xs">
              Los usuarios master tienen todos los permisos
            </p>
          )}
        </div>

        <FormSubmitButton>Guardar cambios</FormSubmitButton>
      </form>

      <div className="border-border bg-card mb-8 rounded-lg border p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Shield className="size-4" />
          Permisos individuales
        </p>

        {usuarioEditar.es_master ? (
          <p className="text-muted-foreground text-xs">
            Este usuario es Master y tiene acceso a todos los permisos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(permisos ?? []).map((p) => {
              const tiene = permisosUsuario.includes(p.nombre);
              const toggleAction = togglePermisoUsuario.bind(null, id);
              return (
                <form key={p.id} action={toggleAction}>
                  <input type="hidden" name="permiso" value={p.nombre} />
                  <input type="hidden" name="accion" value={tiene ? 'quitar' : 'agregar'} />
                  <button
                    type="submit"
                    className={`rounded px-3 py-1 text-xs ${
                      tiene
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/50'
                    }`}
                    title={tiene ? `Quitar permiso ${p.nombre}` : `Dar permiso ${p.nombre}`}
                  >
                    {p.nombre}
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <form action={resetearPassword.bind(null, id)} className="inline">
          <button
            type="submit"
            className="border-border bg-card text-primary hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"
          >
            <Key className="size-4" />
            Resetear contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
