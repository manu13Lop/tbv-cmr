'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { User, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PerfilPage() {
  return (
    <div className="p-6">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>

      <h1 className="text-primary mb-6 text-2xl font-bold">Mi perfil</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-border bg-card rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-3">
            <User className="text-primary size-5" />
            <h2 className="font-semibold">Información de cuenta</h2>
          </div>
          <PerfilInfo />
        </div>

        <div className="border-border bg-card rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-3">
            <KeyRound className="text-primary size-5" />
            <h2 className="font-semibold">Cambiar contraseña</h2>
          </div>
          <CambiarPasswordForm />
        </div>
      </div>
    </div>
  );
}

function PerfilInfo() {
  const [user, setUser] = useState<{ email?: string; nombre?: string; rol?: string } | null>(null);

  if (!user) {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(setUser)
      .catch(() => {});
    return <p className="text-muted-foreground text-sm">Cargando...</p>;
  }

  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Nombre</dt>
        <dd className="font-medium">{user.nombre || '—'}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="font-medium">{user.email || '—'}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Rol</dt>
        <dd className="font-medium">{user.rol || '—'}</dd>
      </div>
    </dl>
  );
}

async function cambiarPasswordAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const actual = formData.get('password_actual') as string;
  const nueva = formData.get('password_nueva') as string;
  const confirmar = formData.get('password_confirmar') as string;

  if (!actual || !nueva || !confirmar) {
    return { error: 'Todos los campos son obligatorios.' };
  }
  if (nueva.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }
  if (nueva !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password_actual: actual, password_nueva: nueva }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.error || 'Error al cambiar la contraseña.' };
  }

  return { success: true };
}

function CambiarPasswordForm() {
  const [state, formAction, isPending] = useActionState(cambiarPasswordAction, {});

  if (state.success) {
    toast.success('Contraseña cambiada correctamente.');
    return <p className="text-primary text-sm">Contraseña cambiada correctamente.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="password_actual" className="text-sm font-medium">
          Contraseña actual
        </label>
        <input
          type="password"
          id="password_actual"
          name="password_actual"
          required
          className="border-border bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password_nueva" className="text-sm font-medium">
          Nueva contraseña
        </label>
        <input
          type="password"
          id="password_nueva"
          name="password_nueva"
          required
          minLength={8}
          className="border-border bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password_confirmar" className="text-sm font-medium">
          Confirmar nueva contraseña
        </label>
        <input
          type="password"
          id="password_confirmar"
          name="password_confirmar"
          required
          minLength={8}
          className="border-border bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 size-4" />
        )}
        Cambiar contraseña
      </Button>
    </form>
  );
}
