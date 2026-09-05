'use client';

import { useState } from 'react';
import { inscribirse } from '@/lib/socios-inscripcion-action';
import { InputField, TextareaField } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function InscripcionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await inscribirse(formData);

    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error ?? null);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 size-16 text-green-600" />
        <h2 className="mb-2 text-xl font-bold">Inscripción recibida</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Tu solicitud de inscripción ha sido registrada. Para completar el proceso:
        </p>
        <ol className="text-muted-foreground mx-auto mb-6 max-w-xs space-y-2 text-left text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              1
            </span>
            <span>Revisa tu email y haz clic en el enlace de verificación.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
              2
            </span>
            <span>La directiva revisará tu solicitud y confirmará el pago.</span>
          </li>
        </ol>
        <Link
          href="/"
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <InputField label="Nombre *" name="nombre" required />
          {fieldErrors.nombre && <p className="mt-1 text-xs text-red-600">{fieldErrors.nombre}</p>}
        </div>
        <div>
          <InputField label="Apellidos *" name="apellidos" required />
          {fieldErrors.apellidos && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.apellidos}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <InputField label="Email *" type="email" name="email" required />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <InputField label="Teléfono *" name="telefono" required />
          {fieldErrors.telefono && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.telefono}</p>
          )}
        </div>
      </div>

      <InputField label="DNI" name="dni" placeholder="12345678A" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Dirección" name="direccion" placeholder="Calle, número, piso..." />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Ciudad" name="ciudad" />
          <InputField label="Código postal" name="codigo_postal" />
        </div>
      </div>

      <TextareaField
        label="Notas"
        name="notas"
        placeholder="Alguna información adicional que quieras compartir..."
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Procesando...
          </>
        ) : (
          'Inscribirme como socio'
        )}
      </Button>
    </form>
  );
}
