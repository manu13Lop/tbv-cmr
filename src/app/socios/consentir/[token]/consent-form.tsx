'use client';

import { useRef } from 'react';
import { useActionState } from 'react';
import { registrarConsentimiento } from '@/lib/socios-actions';
import { Loader2 } from 'lucide-react';

export function ConsentForm({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; ok?: boolean; estado?: string }, formData: FormData) => {
      const acepta = formData.get('acepta') === 'true';
      const rechaza = formData.get('rechaza') === 'true';

      if (!acepta && !rechaza) {
        return { error: 'Debes marcar una opción para continuar.' };
      }

      if (acepta && rechaza) {
        return { error: 'Solo puedes marcar una opción.' };
      }

      const result = await registrarConsentimiento(token, acepta, 'registro', navigator.userAgent);
      return result;
    },
    { error: '', ok: false, estado: '' } as { error?: string; ok?: boolean; estado?: string }
  );

  if (state.ok) {
    return (
      <div className="text-center">
        <p className="text-primary text-sm font-semibold">
          {state.estado === 'aceptado'
            ? 'Consentimiento aceptado correctamente.'
            : 'Consentimiento registrado. No recibirás comunicaciones por estos canales.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <p className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {state.error}
        </p>
      )}
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <label className="border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
          <input
            type="checkbox"
            name="acepta"
            value="true"
            className="border-border bg-background mt-0.5 size-4 rounded"
          />
          <span className="text-sm">
            <strong>Acepto</strong> recibir comunicaciones de Triana Balonmano Vivero por email y
            WhatsApp conforme a la información anterior.
          </span>
        </label>

        <label className="border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
          <input
            type="checkbox"
            name="rechaza"
            value="true"
            className="border-border bg-background mt-0.5 size-4 rounded"
          />
          <span className="text-muted-foreground text-sm">
            <strong>No acepto</strong> recibir comunicaciones.
          </span>
        </label>

        <p className="text-muted-foreground text-xs">
          Tu decisión quedará registrada con fecha, hora, dirección IP y datos del navegador como
          prueba de tu consentimiento.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Enviar consentimiento
        </button>
      </form>
    </>
  );
}
