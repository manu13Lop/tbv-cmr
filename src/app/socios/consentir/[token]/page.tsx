import { createClient } from '@/lib/supabase-server';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import { ConsentForm } from './consent-form';

export default async function ConsentirPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: socio } = await supabase
    .from('socios')
    .select('nombre, apellidos, consentimiento_estado')
    .eq('token_consentimiento', token)
    .single();

  if (!socio) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="border-border bg-card max-w-md rounded-xl border p-8 text-center">
          <XCircle className="text-destructive mx-auto mb-4 size-12" />
          <h1 className="mb-2 text-xl font-bold">Enlace no válido</h1>
          <p className="text-muted-foreground text-sm">
            Este enlace de consentimiento no es válido o ha expirado. Contacta con la directiva del
            club para más información.
          </p>
        </div>
      </div>
    );
  }

  if (socio.consentimiento_estado !== 'pendiente') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="border-border bg-card max-w-md rounded-xl border p-8 text-center">
          <CheckCircle className="text-primary mx-auto mb-4 size-12" />
          <h1 className="mb-2 text-xl font-bold">Consentimiento ya registrado</h1>
          <p className="text-muted-foreground text-sm">
            {socio.consentimiento_estado === 'aceptado'
              ? 'Ya has aceptado el consentimiento de comunicaciones. Gracias.'
              : 'Ya has registrado tu decisión sobre el consentimiento de comunicaciones.'}
          </p>
          <p className="text-muted-foreground mt-4 text-xs">
            Si necesitas cambiar tu decisión, contacta con la directiva del club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="border-border bg-card max-w-lg rounded-xl border p-8">
        <div className="mb-6 text-center">
          <Shield className="text-primary mx-auto mb-4 size-12" />
          <h1 className="mb-2 text-xl font-bold">Consentimiento de comunicaciones</h1>
          <p className="text-muted-foreground text-sm">
            Hola,{' '}
            <strong>
              {socio.nombre} {socio.apellidos}
            </strong>
          </p>
        </div>

        <div className="border-border bg-muted/50 mb-6 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">
            RGPD — Reglamento General de Protección de Datos
          </h2>
          <div className="text-muted-foreground space-y-3 text-xs leading-relaxed">
            <p>
              En cumplimiento del <strong>Reglamento General de Protección de Datos (RGPD)</strong>{' '}
              y la
              <strong> Ley Orgánica 3/2018</strong>, de 5 de diciembre, de Protección de Datos
              Personales y garantía de los derechos digitales (LOPDGDD), te informamos que los datos
              proporcionados serán tratados por <strong>Triana Balonmano Vivero</strong> con la
              finalidad de:
            </p>
            <ul className="list-disc pl-4">
              <li>
                Enviar comunicaciones sobre actividades, eventos y novedades del club por{' '}
                <strong>email</strong>.
              </li>
              <li>
                Enviar información relevante por <strong>WhatsApp</strong> al número facilitado.
              </li>
            </ul>
            <p>
              La base legitimadora es tu consentimiento expreso (art. 6.1.a RGPD). Puedes retirar tu
              consentimiento en cualquier momento contactando con la directiva del club, sin que
              ello afecte a la licitud del tratamiento basado en el consentimiento previo a su
              retirada.
            </p>
            <p>
              Tus datos no serán cedidos a terceros salvo obligación legal. Puedes ejercer tus
              derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición
              contactando con la directiva del club.
            </p>
          </div>
        </div>

        <ConsentForm token={token} />
      </div>
    </div>
  );
}
