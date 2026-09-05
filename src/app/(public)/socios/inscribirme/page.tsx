import { Shield } from 'lucide-react';
import { InscripcionForm } from './inscripcion-form';

export default function InscribirmePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <img
            src="/logo.jpg"
            alt="Triana Balonmano Vivero"
            className="mx-auto mb-4 h-32 w-32 rounded-full object-cover"
          />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Triana Balonmano Vivero</h1>
          <p className="text-sm text-gray-600">Club de Balonmano</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <Shield className="mx-auto mb-3 size-10 text-[#7a1f2b]" />
            <h2 className="mb-1 text-lg font-bold text-gray-900">Inscripción como socio/a</h2>
            <p className="text-xs text-gray-500">Completa tus datos para formar parte del club</p>
          </div>

          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              <strong>RGPD:</strong> Al inscribirte aceptas que tus datos sean utilizados para la
              gestión del club y el envío de comunicaciones. Puedes retirar tu consentimiento en
              cualquier momento contactando con la directiva.
            </p>
          </div>

          <InscripcionForm />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Ya eres socio?{' '}
          <a href="/login" className="text-[#7a1f2b] hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
}
