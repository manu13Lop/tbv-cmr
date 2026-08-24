import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-primary text-6xl font-bold">404</h1>
        <p className="text-muted-foreground text-xl">Página no encontrada</p>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium"
        >
          <Home className="size-4" />
          Volver al inicio
        </Link>
        <Link
          href="/"
          className="border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-medium"
        >
          <Search className="size-4" />
          Buscar
        </Link>
      </div>
    </main>
  );
}
