'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('Inicializando...');

  useEffect(() => {
    const run = async () => {
      setStatus('loading');
      setMessage('Conectando con Supabase desde el browser...');

      try {
        const supabase = createClient();

        setMessage('Creando usuario en Supabase Auth...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'admin@tbv.test',
          password: 'TbvTest2026!',
          options: { data: { nombre: 'Admin', apellidos: 'TBV Test' } },
        });

        if (signUpError) {
          if (
            signUpError.message?.includes('already') ||
            signUpError.message?.includes('already registered')
          ) {
            setMessage('Usuario ya existe en Auth. Buscando ID...');
          } else {
            setMessage(`Error Auth: ${signUpError.message}`);
            setStatus('error');
            return;
          }
        }

        const userId = signUpData?.user?.id;

        if (!userId) {
          const { data: existing } = await supabase.auth.signInWithPassword({
            email: 'admin@tbv.test',
            password: 'TbvTest2026!',
          });

          if (existing?.user?.id) {
            setMessage('Usuario encontrado. Insertando en tabla usuarios...');
          } else {
            setStatus('error');
            setMessage('No se pudo obtener el ID del usuario. Intenta desde Supabase Dashboard.');
            return;
          }
        }

        const finalUserId = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!finalUserId) {
          setStatus('error');
          setMessage('No se pudo obtener el ID del usuario.');
          return;
        }

        setMessage('Insertando registro en tabla usuarios...');
        const { error: insertError } = await supabase.from('usuarios').upsert(
          {
            id: finalUserId,
            nombre: 'Admin',
            apellidos: 'TBV Test',
            es_master: true,
            rol_id: null,
          },
          { onConflict: 'id' }
        );

        if (insertError) {
          if (insertError.message?.includes('already') || insertError.code === '23505') {
            setMessage('Registro ya existía en usuarios. Todo OK.');
          } else {
            setMessage(
              `Error en tabla usuarios: ${insertError.message} (código: ${insertError.code}). Si la tabla no existe, ejecuta la migración SQL primero.`
            );
            setStatus('error');
            return;
          }
        }

        setStatus('done');
        setMessage('Usuario admin@tbv.test creado con éxito. Acceso master habilitado.');
      } catch (err) {
        setStatus('error');
        setMessage(`Error: ${String(err)}`);
      }
    };

    run();
  }, []);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-card w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Setup — Usuario de Prueba</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Creación automática de usuario master
          </p>
        </div>

        <div className="border-border bg-muted/50 space-y-1 rounded-md border p-4 text-sm">
          <p>
            <strong>Email:</strong> admin@tbv.test
          </p>
          <p>
            <strong>Password:</strong> TbvTest2026!
          </p>
          <p>
            <strong>Rol:</strong> Master (acceso total)
          </p>
        </div>

        <div
          className={`rounded-md border p-4 text-sm ${
            status === 'done'
              ? 'border-green-200 bg-green-50 text-green-800'
              : status === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {status === 'done' && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
            {status === 'error' && <XCircle className="mt-0.5 size-4 shrink-0" />}
            {status === 'loading' && <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />}
            <span>{message}</span>
          </div>
        </div>

        {status === 'done' && (
          <a
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            Ir a Login
          </a>
        )}

        {status === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
