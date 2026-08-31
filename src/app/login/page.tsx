'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const attemptsRef = useRef(0);
  const lockedUntilRef = useRef<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockedUntilRef.current !== null && Date.now() < lockedUntilRef.current) {
      const secondsLeft = Math.ceil((lockedUntilRef.current - Date.now()) / 1000);
      setError(`Demasiados intentos. Espera ${secondsLeft}s.`);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      attemptsRef.current += 1;

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockedUntilRef.current = Date.now() + LOCKOUT_MS;
        setError('Demasiados intentos fallidos. Espera 60 segundos.');
      } else {
        setError(`Email o contraseña incorrectos. (${attemptsRef.current}/${MAX_ATTEMPTS})`);
      }
      return;
    }

    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    router.push(returnTo ? decodeURIComponent(returnTo) : '/');
    router.refresh();
  };

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/logo.jpg"
          alt="Triana Balonmano Vivero"
          width={96}
          height={96}
          className="rounded-full"
          priority
        />
        <p className="text-muted-foreground text-sm">Triana Balonmano Vivero</p>
      </div>

      <form
        onSubmit={handleLogin}
        className="border-border bg-card flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-3"
            placeholder="entrenador@tbv.es"
            autoComplete="username"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-3"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </main>
  );
}
