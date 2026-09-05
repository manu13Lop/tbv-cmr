import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, CreditCard, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { InputField, SelectField, TextareaField } from '@/components/ui';
import { FormSubmitButton } from '@/components/form-submit-button';
import { ConfirmActionButton } from '@/components/confirm-action-button';
import {
  reenviarConsentimiento,
  reenviarVerificacionEmail,
  registrarPago,
  eliminarPago,
  eliminarSocio,
} from '@/lib/socios-actions';

export default async function SocioDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.leer')) redirect('/');
  const puedeEditar = tienePermiso(usuario.permisos, 'socios.editar');

  const supabase = await createClient();
  const { data: socio } = await supabase.from('socios').select('*').eq('id', id).single();

  if (!socio) notFound();

  const { data: pagos } = await supabase
    .from('socios_pagos')
    .select('*')
    .eq('socio_id', id)
    .order('created_at', { ascending: false });

  const totalPagado = (pagos ?? [])
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + Number(p.importe), 0);
  const totalPendiente = (pagos ?? [])
    .filter((p) => p.estado === 'pendiente')
    .reduce((sum, p) => sum + Number(p.importe), 0);

  const registrarPagoAction = registrarPago.bind(null, id);

  return (
    <div className="p-6">
      <Link
        href="/socios"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver a socios
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-primary text-2xl font-bold">
            {socio.numero_socio} · {socio.nombre} {socio.apellidos}
          </h1>
          <p className="text-muted-foreground text-sm">
            {socio.activo ? (
              <span className="text-green-600">Activo</span>
            ) : (
              <span className="text-muted-foreground">Inactivo</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {puedeEditar && (
            <Link href={`/socios/${id}/editar`}>
              <button className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-xs font-medium transition-colors">
                Editar datos
              </button>
            </Link>
          )}
          {puedeEditar && socio.email && socio.consentimiento_estado === 'pendiente' && (
            <form action={reenviarConsentimiento.bind(null, id)}>
              <button
                type="submit"
                className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Mail className="size-3" />
                Reenviar consentimiento
              </button>
            </form>
          )}
          {puedeEditar && socio.email && !socio.email_verificado && (
            <form action={reenviarVerificacionEmail.bind(null, id)}>
              <button
                type="submit"
                className="border-border bg-background hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Mail className="size-3" />
                Reenviar verificación
              </button>
            </form>
          )}
          {puedeEditar && (
            <ConfirmActionButton
              onConfirm={async () => {
                'use server';
                await eliminarSocio(id);
              }}
              label="Eliminar socio"
              confirmTitle="Eliminar socio"
              confirmDescription="¿Seguro que quieres eliminar este socio? Esta acción no se puede deshacer."
              className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div className="border-primary bg-primary/10 text-primary mb-4 rounded-md border p-3 text-sm">
          {decodeURIComponent(success)}
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="border-border bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Email verificado</p>
          <div className="mt-1 flex items-center gap-2">
            {socio.email_verificado ? (
              <CheckCircle className="size-4 text-green-600" />
            ) : (
              <AlertTriangle className="size-4 text-yellow-600" />
            )}
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                socio.email_verificado
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}
            >
              {socio.email_verificado ? 'Verificado' : 'Pendiente'}
            </span>
          </div>
        </div>
        <div className="border-border bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Total pagado</p>
          <p className="text-2xl font-bold text-green-600">{totalPagado.toFixed(2)}€</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Pendiente</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPendiente.toFixed(2)}€</p>
        </div>
        <div className="border-border bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Consentimiento RGPD</p>
          <div className="mt-1 flex items-center gap-2">
            <Shield
              className={`size-4 ${socio.consentimiento_estado === 'aceptado' ? 'text-green-600' : socio.consentimiento_estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'}`}
            />
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                socio.consentimiento_estado === 'aceptado'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : socio.consentimiento_estado === 'rechazado'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}
            >
              {socio.consentimiento_estado === 'aceptado'
                ? `Aceptado ${socio.consentimiento_fecha ? new Date(socio.consentimiento_fecha).toLocaleDateString('es-ES') : ''}`
                : socio.consentimiento_estado === 'rechazado'
                  ? 'Rechazado'
                  : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      {puedeEditar ? (
        <form
          action={async (formData) => {
            'use server';
            const { actualizarSocio } = await import('@/lib/socios-actions');
            await actualizarSocio(id, formData);
          }}
          className="max-w-lg space-y-4"
        >
          <h2 className="text-primary mb-4 text-lg font-bold">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nombre" name="nombre" defaultValue={socio.nombre} required />
            <InputField
              label="Apellidos"
              name="apellidos"
              defaultValue={socio.apellidos}
              required
            />
          </div>
          <InputField label="DNI" name="dni" defaultValue={socio.dni ?? ''} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Email" type="email" name="email" defaultValue={socio.email ?? ''} />
            <InputField label="Teléfono" name="telefono" defaultValue={socio.telefono ?? ''} />
          </div>
          <InputField
            label="Fecha de nacimiento"
            type="date"
            name="fecha_nacimiento"
            defaultValue={socio.fecha_nacimiento ?? ''}
          />
          <InputField label="Dirección" name="direccion" defaultValue={socio.direccion ?? ''} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Ciudad" name="ciudad" defaultValue={socio.ciudad ?? ''} />
            <InputField
              label="Código postal"
              name="codigo_postal"
              defaultValue={socio.codigo_postal ?? ''}
            />
          </div>
          <TextareaField label="Notas internas" name="notas" defaultValue={socio.notas ?? ''} />
          <FormSubmitButton>Guardar cambios</FormSubmitButton>
        </form>
      ) : (
        <div className="max-w-lg space-y-4">
          <h2 className="text-primary mb-4 text-lg font-bold">Datos personales</h2>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-medium">
                  {socio.nombre} {socio.apellidos}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">DNI</dt>
                <dd className="font-medium">{socio.dni || '—'}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{socio.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd className="font-medium">{socio.telefono || '—'}</dd>
              </div>
            </div>
            <div>
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="font-medium">
                {socio.direccion || '—'}
                {socio.ciudad ? `, ${socio.ciudad}` : ''}
                {socio.codigo_postal ? ` (${socio.codigo_postal})` : ''}
              </dd>
            </div>
            {socio.notas && (
              <div>
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="font-medium">{socio.notas}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <hr className="border-border my-8" />

      {/* Historial de pagos */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-primary text-lg font-bold">Historial de pagos</h2>
        {puedeEditar && (
          <span className="text-muted-foreground text-xs">
            {(pagos ?? []).length} pago(s) registrado(s)
          </span>
        )}
      </div>

      {(pagos ?? []).length === 0 ? (
        <div className="border-border bg-muted/50 rounded-lg border border-dashed p-8 text-center">
          <CreditCard className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">No hay pagos registrados.</p>
        </div>
      ) : (
        <div className="border-border mb-6 rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 text-left font-medium">
                    Concepto
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Importe
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Estado
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Fecha
                  </th>
                  <th scope="col" className="p-3 text-left font-medium">
                    Método
                  </th>
                  {puedeEditar && (
                    <th scope="col" className="p-3 text-left font-medium">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(pagos ?? []).map((p) => (
                  <tr key={p.id} className="border-border border-t">
                    <td className="p-3 font-medium">{p.concepto}</td>
                    <td className="p-3">{Number(p.importe).toFixed(2)}€</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          p.estado === 'pagado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="text-muted-foreground p-3">
                      {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="text-muted-foreground p-3">{p.metodo_pago || '—'}</td>
                    {puedeEditar && (
                      <td className="p-3">
                        <ConfirmActionButton
                          onConfirm={async () => {
                            'use server';
                            await eliminarPago(p.id, id);
                          }}
                          label="Eliminar"
                          confirmTitle="Eliminar pago"
                          confirmDescription="¿Seguro que quieres eliminar este pago?"
                          className="text-destructive text-xs hover:underline"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulario de nuevo pago */}
      {puedeEditar && (
        <form
          action={registrarPagoAction}
          className="border-border bg-card max-w-lg space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm font-medium">Registrar nuevo pago</p>
          <InputField
            label="Concepto"
            name="concepto"
            placeholder="Cuota anual 2026, Material..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Importe (€)"
              type="number"
              name="importe"
              step="0.01"
              min="0"
              required
            />
            <SelectField
              label="Estado"
              name="estado"
              options={[
                { value: 'pagado', label: 'Pagado' },
                { value: 'pendiente', label: 'Pendiente' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Fecha de pago" type="date" name="fecha_pago" />
            <SelectField
              label="Método de pago"
              name="metodo_pago"
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: 'Efectivo', label: 'Efectivo' },
                { value: 'Transferencia', label: 'Transferencia' },
                { value: 'Bizum', label: 'Bizum' },
                { value: 'Tarjeta', label: 'Tarjeta' },
              ]}
            />
          </div>
          <InputField
            label="Referencia"
            name="referencia"
            placeholder="N.º recibo o transferencia"
          />
          <TextareaField label="Notas" name="notas" />
          <FormSubmitButton>Registrar pago</FormSubmitButton>
        </form>
      )}
    </div>
  );
}
