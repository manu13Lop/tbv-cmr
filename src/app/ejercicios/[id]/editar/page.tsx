import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual } from '@/lib/auth-helpers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditarEjercicioForm } from './editar-ejercicio-form';

export default async function EditarEjercicioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuarioActual = await getUsuarioActual();
  if (!usuarioActual) redirect('/login');

  const supabase = await createClient();

  const { data: ejercicio } = await supabase
    .from('ejercicios')
    .select('*, ejercicio_archivos(id, tipo, url, nombre)')
    .eq('id', id)
    .single();

  if (!ejercicio) notFound();

  if (ejercicio.created_by !== usuarioActual.id) {
    redirect(`/ejercicios/${id}`);
  }

  const archivos =
    (ejercicio.ejercicio_archivos as unknown as {
      id: string;
      tipo: string;
      url: string;
      nombre: string | null;
    }[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/ejercicios/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editar ejercicio</h1>
          <p className="text-muted-foreground text-sm">Modifica los datos del ejercicio</p>
        </div>
      </div>

      <EditarEjercicioForm ejercicio={ejercicio} archivos={archivos} />
    </div>
  );
}
