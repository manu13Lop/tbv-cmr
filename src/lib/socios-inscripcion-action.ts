'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase-server';
import { resend, EMAIL_FROM } from '@/lib/resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function generateNumeroSocio(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('socios')
    .select('numero_socio')
    .like('numero_socio', `SOC-${year}-%`)
    .order('numero_socio', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return `SOC-${year}-001`;
  const first = data[0];
  if (!first) return `SOC-${year}-001`;
  const lastNum = parseInt(first.numero_socio.split('-')[2], 10);
  const nextNum = String(lastNum + 1).padStart(3, '0');
  return `SOC-${year}-${nextNum}`;
}

async function enviarEmailVerificacion(socio: {
  nombre: string;
  apellidos: string;
  email: string;
  email_verificacion_token: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tbv-cmr.vercel.app';
  const linkVerificacion = `${appUrl}/socios/verificar-email/${socio.email_verificacion_token}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #7a1f2b; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Triana Balonmano Vivero</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">
        Verifica tu email
      </h2>
      <p style="color: #4a4a4a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">
        Hola <strong>${escapeHtml(socio.nombre)} ${escapeHtml(socio.apellidos)}</strong>,
        para completar tu inscripción como socio/a, necesitamos verificar tu dirección de email.
      </p>
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${linkVerificacion}"
           style="display: inline-block; background-color: #7a1f2b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Verificar mi email
        </a>
      </div>
      <p style="color: #8a8a8a; margin: 0; font-size: 12px; text-align: center; line-height: 1.5;">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <span style="color: #7a1f2b;">${linkVerificacion}</span>
      </p>
    </div>
    <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center;">
      <p style="color: #8a8a8a; margin: 0; font-size: 11px;">Triana Balonmano Vivero · Club de Balonmano</p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: socio.email,
    subject: 'Verifica tu email — Triana Balonmano Vivero',
    html,
  });
}

export async function inscribirse(formData: FormData) {
  const hdrs = await headers();
  const forwarded = hdrs.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  // Rate limiting: 3 inscripciones por IP por hora
  const { checkInMemoryRateLimit } = await import('@/lib/rate-limit');
  const rateLimit = checkInMemoryRateLimit(`inscripcion:${ip}`, 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: 'Has alcanzado el límite de inscripciones. Inténtalo más tarde.',
    };
  }

  const nombre = formData.get('nombre')?.toString().trim() || '';
  const apellidos = formData.get('apellidos')?.toString().trim() || '';
  const email = formData.get('email')?.toString().trim() || '';
  const telefono = formData.get('telefono')?.toString().trim() || '';

  const fieldErrors: Record<string, string> = {};
  if (!nombre) fieldErrors.nombre = 'El nombre es obligatorio';
  if (!apellidos) fieldErrors.apellidos = 'Los apellidos son obligatorios';
  if (!email) fieldErrors.email = 'El email es obligatorio';
  if (!telefono) fieldErrors.telefono = 'El teléfono es obligatorio';

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Por favor, completa todos los campos obligatorios.', fieldErrors };
  }

  const supabase = await createClient();
  const numeroSocio = await generateNumeroSocio();

  const { data: socio, error } = await supabase
    .from('socios')
    .insert({
      numero_socio: numeroSocio,
      nombre,
      apellidos,
      email: email || null,
      telefono: telefono || null,
      direccion: formData.get('direccion')?.toString().trim() || null,
      ciudad: formData.get('ciudad')?.toString().trim() || null,
      codigo_postal: formData.get('codigo_postal')?.toString().trim() || null,
      notas: formData.get('notas')?.toString().trim() || null,
      activo: false,
      consentimiento_estado: 'aceptado',
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_ip: ip,
      email_verificado: false,
    })
    .select('id, nombre, apellidos, email, email_verificacion_token')
    .single();

  if (error) {
    if (error.message?.includes('duplicate key') && error.message?.includes('email')) {
      return { ok: false, error: 'Este email ya está registrado como socio.' };
    }
    return { ok: false, error: 'Error al procesar la inscripción. Inténtalo de nuevo.' };
  }

  if (!socio) {
    return { ok: false, error: 'Error al procesar la inscripción.' };
  }

  // Auto-crear registro de pago pendiente
  await supabase.from('socios_pagos').insert({
    socio_id: socio.id,
    concepto: 'Cuota de socio 2026',
    importe: 0,
    estado: 'pendiente',
  });

  // Enviar email de verificación (fire-and-forget)
  if (socio.email) {
    enviarEmailVerificacion(socio).catch((e) => {
      console.error('[inscripcion] Error sending verification email:', e);
    });
  }

  return {
    ok: true,
    socio: { id: socio.id, nombre: socio.nombre, apellidos: socio.apellidos },
  };
}
