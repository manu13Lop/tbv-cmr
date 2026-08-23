import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ArrowLeft } from 'lucide-react';
import { validateFormData, getFirstError } from '@/lib/validate';
import { actualizarJugadoraSchema, asignarEquipoSchema, crearTutorSchema } from '@/lib/validations';
import { ConfirmActionButton } from '@/components/confirm-action-button';

async function actualizarJugadora(id: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.editar')) return;

  const validation = validateFormData(actualizarJugadoraSchema, formData);
  if (!validation.success) {
    return redirect(
      `/jugadoras/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const {
    nombre,
    apellidos,
    fecha_nacimiento,
    codigo_interno,
    email,
    talla_camiseta_entreno,
    talla_camiseta_partido,
    talla_calzona,
    talla_chandal,
    talla_chaqueton,
    reconocimiento_medico_estado,
    activa,
  } = validation.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('jugadoras')
    .update({
      nombre,
      apellidos,
      fecha_nacimiento,
      codigo_interno,
      email,
      talla_camiseta_entreno,
      talla_camiseta_partido,
      talla_calzona,
      talla_chandal,
      talla_chaqueton,
      reconocimiento_medico_estado,
      activa,
    })
    .eq('id', id);

  if (error) redirect(`/jugadoras/${id}?error=Error+al+guardar`);
  redirect(`/jugadoras/${id}?guardado=1`);
}

async function asignarEquipo(id: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.editar')) return;

  const validation = validateFormData(asignarEquipoSchema, formData);
  if (!validation.success) {
    return redirect(
      `/jugadoras/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { equipo_id, temporada, dorsal, posicion } = validation.data;
  const supabase = await createClient();
  const { error } = await supabase.from('jugadora_equipo_temporada').insert({
    jugadora_id: id,
    equipo_id,
    temporada,
    dorsal,
    posicion,
  });

  if (error) redirect(`/jugadoras/${id}?error=Error+al+asignar+equipo`);
  redirect(`/jugadoras/${id}`);
}

async function quitarVinculo(id: string, vinculoId: string) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.editar')) return;

  const supabase = await createClient();
  const { error } = await supabase.from('jugadora_equipo_temporada').delete().eq('id', vinculoId);

  if (error) redirect(`/jugadoras/${id}?error=Error+al+quitar+v%C3%ADnculo`);
  redirect(`/jugadoras/${id}`);
}

async function crearTutor(id: string, formData: FormData) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.editar')) return;

  const validation = validateFormData(crearTutorSchema, formData);
  if (!validation.success) {
    return redirect(
      `/jugadoras/${id}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { nombre, email, telefono, parentesco } = validation.data;
  const supabase = await createClient();
  const { error } = await supabase.from('tutores').insert({
    jugadora_id: id,
    nombre,
    email: email || null,
    telefono: telefono || null,
    parentesco: parentesco || null,
  });

  if (error) redirect(`/jugadoras/${id}?error=Error+al+crear+tutor`);
  redirect(`/jugadoras/${id}`);
}

async function borrarTutor(id: string, tutorId: string) {
  'use server';
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.editar')) return;

  const supabase = await createClient();
  const { error } = await supabase.from('tutores').delete().eq('id', tutorId);

  if (error) redirect(`/jugadoras/${id}?error=Error+al+borrar+tutor`);
  redirect(`/jugadoras/${id}`);
}

const tallaOptions = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

function TallaSelect({
  name,
  label,
  value,
  disabled,
}: {
  name: string;
  label: string;
  value: string | null;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={value ?? ''}
        disabled={disabled}
        className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
      >
        {tallaOptions.map((t) => (
          <option key={t} value={t}>
            {t === '' ? '-' : t}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function JugadoraDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { id } = await params;
  const { guardado } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'jugadoras.leer')) {
    redirect('/');
  }
  const puedeEditar = tienePermiso(usuario.permisos, 'jugadoras.editar');

  const supabase = await createClient();

  const { data: jugadora } = await supabase.from('jugadoras').select('*').eq('id', id).single();

  if (!jugadora) notFound();

  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, categoria, temporada')
    .order('temporada', { ascending: false });

  const { data: vinculos } = await supabase
    .from('jugadora_equipo_temporada')
    .select('id, temporada, dorsal, posicion, equipos ( nombre, categoria )')
    .eq('jugadora_id', id);

  const { data: tutores } = await supabase
    .from('tutores')
    .select('id, nombre, email, telefono, parentesco')
    .eq('jugadora_id', id)
    .order('created_at');

  const updateAction = actualizarJugadora.bind(null, id);
  const asignarAction = asignarEquipo.bind(null, id);
  const crearTutorAction = crearTutor.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/jugadoras"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a jugadoras
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">
        {jugadora.nombre} {jugadora.apellidos}
      </h1>

      {guardado === '1' && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          Cambios guardados correctamente.
        </div>
      )}

      <form action={updateAction} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            defaultValue={jugadora.nombre}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Apellidos</label>
          <input
            name="apellidos"
            defaultValue={jugadora.apellidos}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Fecha de nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            defaultValue={jugadora.fecha_nacimiento}
            required
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Código interno</label>
          <input
            name="codigo_interno"
            defaultValue={jugadora.codigo_interno ?? ''}
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={jugadora.email ?? ''}
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TallaSelect
            name="talla_camiseta_entreno"
            label="Camiseta entreno"
            value={jugadora.talla_camiseta_entreno}
            disabled={!puedeEditar}
          />
          <TallaSelect
            name="talla_camiseta_partido"
            label="Camiseta partido"
            value={jugadora.talla_camiseta_partido}
            disabled={!puedeEditar}
          />
          <TallaSelect
            name="talla_calzona"
            label="Calzona"
            value={jugadora.talla_calzona}
            disabled={!puedeEditar}
          />
          <TallaSelect
            name="talla_chandal"
            label="Chándal"
            value={jugadora.talla_chandal}
            disabled={!puedeEditar}
          />
          <TallaSelect
            name="talla_chaqueton"
            label="Chaquetón"
            value={jugadora.talla_chaqueton}
            disabled={!puedeEditar}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Reconocimiento médico</label>
          <select
            name="reconocimiento_medico_estado"
            defaultValue={jugadora.reconocimiento_medico_estado ?? 'pendiente'}
            disabled={!puedeEditar}
            className="border-border bg-background w-full rounded-md border p-2 text-sm disabled:opacity-60"
          >
            <option value="pendiente">Pendiente</option>
            <option value="apto">Apto</option>
            <option value="no_apto">No apto</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="activa"
            id="activa"
            defaultChecked={jugadora.activa}
            disabled={!puedeEditar}
          />
          <label htmlFor="activa" className="text-sm font-medium">
            Jugadora activa
          </label>
        </div>

        {puedeEditar && <FormSubmitButton>Guardar cambios</FormSubmitButton>}
      </form>

      <hr className="border-border my-8" />

      <h2 className="text-primary mb-4 text-lg font-bold">Equipos asignados</h2>

      {!vinculos || vinculos.length === 0 ? (
        <p className="text-muted-foreground mb-4 text-sm">
          Esta jugadora no está asignada a ningún equipo todavía.
        </p>
      ) : (
        <div className="border-border mb-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Equipo</th>
                <th className="p-3 text-left font-medium">Temporada</th>
                <th className="p-3 text-left font-medium">Dorsal</th>
                <th className="p-3 text-left font-medium">Posición</th>
                {puedeEditar && <th className="p-3 text-left font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {vinculos.map((v: Record<string, unknown>) => {
                return (
                  <tr key={v.id as string} className="border-border border-t">
                    <td className="p-3">
                      {(v.equipos as Record<string, unknown>)?.nombre as string} (
                      {(v.equipos as Record<string, unknown>)?.categoria as string})
                    </td>
                    <td className="p-3">{v.temporada as string}</td>
                    <td className="p-3">{(v.dorsal as string) ?? '-'}</td>
                    <td className="p-3">{(v.posicion as string) ?? '-'}</td>
                    {puedeEditar && (
                      <td className="p-3 text-right">
                        <ConfirmActionButton
                          onConfirm={() => quitarVinculo(id, v.id as string)}
                          label="Quitar"
                          confirmTitle="Quitar vínculo de equipo"
                          confirmDescription="¿Segura que quieres desasignar esta jugadora de este equipo?"
                          className="text-destructive text-xs hover:underline"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {puedeEditar && (
        <form
          action={asignarAction}
          className="border-border bg-card max-w-lg space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm font-medium">Asignar a un equipo</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Equipo</label>
            <select
              name="equipo_id"
              required
              defaultValue=""
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            >
              <option value="" disabled>
                Selecciona un equipo
              </option>
              {equipos?.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre} ({eq.categoria}) - {eq.temporada}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Temporada</label>
            <input
              name="temporada"
              required
              placeholder="Ej: 2025-2026"
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Dorsal</label>
              <input
                type="number"
                name="dorsal"
                min="0"
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Posición</label>
              <select
                name="posicion"
                defaultValue=""
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="">-</option>
                <option value="Portera">Portera</option>
                <option value="Lateral izquierdo">Lateral izquierdo</option>
                <option value="Lateral derecho">Lateral derecho</option>
                <option value="Central">Central</option>
                <option value="Extremo izquierdo">Extremo izquierdo</option>
                <option value="Extremo derecho">Extremo derecho</option>
                <option value="Pivote">Pivote</option>
              </select>
            </div>
          </div>

          <FormSubmitButton>Asignar</FormSubmitButton>
        </form>
      )}

      <hr className="border-border my-8" />

      <h2 className="text-primary mb-4 text-lg font-bold">Tutores legales</h2>

      {!tutores || tutores.length === 0 ? (
        <p className="text-muted-foreground mb-4 text-sm">
          Esta jugadora no tiene tutores registrados.
        </p>
      ) : (
        <div className="border-border mb-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Nombre</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Teléfono</th>
                <th className="p-3 text-left font-medium">Parentesco</th>
                {puedeEditar && <th className="p-3 text-left font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {tutores.map((t: Record<string, unknown>) => {
                return (
                  <tr key={t.id as string} className="border-border border-t">
                    <td className="p-3">{t.nombre as string}</td>
                    <td className="p-3">{(t.email as string) ?? '-'}</td>
                    <td className="p-3">{(t.telefono as string) ?? '-'}</td>
                    <td className="p-3">{(t.parentesco as string) ?? '-'}</td>
                    {puedeEditar && (
                      <td className="p-3 text-right">
                        <ConfirmActionButton
                          onConfirm={() => borrarTutor(id, t.id as string)}
                          label="Quitar"
                          confirmTitle="Eliminar tutor"
                          confirmDescription="¿Segura que quieres eliminar este tutor legal?"
                          className="text-destructive text-xs hover:underline"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {puedeEditar && (
        <form
          action={crearTutorAction}
          className="border-border bg-card max-w-lg space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm font-medium">Añadir tutor legal</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              required
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              className="border-border bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <input
                name="telefono"
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Parentesco</label>
              <select
                name="parentesco"
                defaultValue=""
                className="border-border bg-background w-full rounded-md border p-2 text-sm"
              >
                <option value="">-</option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor legal">Tutor legal</option>
              </select>
            </div>
          </div>

          <FormSubmitButton>Añadir tutor</FormSubmitButton>
        </form>
      )}
    </div>
  );
}
