'use server';

import { createClient } from '@/lib/supabase-server';
import { getUsuarioActual, tienePermiso } from '@/lib/auth-helpers';
import { logCambio } from '@/lib/audit';
import { redirect } from 'next/navigation';
import { validateFormData, getFirstError } from '@/lib/validate';
import {
  crearSocioSchema,
  actualizarSocioSchema,
  crearPagoSocioSchema,
  actualizarPagoSocioSchema,
} from '@/lib/validations';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { rateLimiters } from '@/lib/rate-limit';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
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

  if (!data || data.length === 0) {
    return `SOC-${year}-001`;
  }

  const first = data[0];
  if (!first) return `SOC-${year}-001`;
  const lastNum = parseInt(first.numero_socio.split('-')[2], 10);
  const nextNum = String(lastNum + 1).padStart(3, '0');
  return `SOC-${year}-${nextNum}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function enviarEmailConsentimiento(socio: {
  nombre: string;
  apellidos: string;
  email: string;
  token_consentimiento: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tbv-cmr.vercel.app';
  const linkConsentimiento = `${appUrl}/socios/consentir/${socio.token_consentimiento}`;

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
        Bienvenido/a, ${escapeHtml(socio.nombre)} ${escapeHtml(socio.apellidos)}
      </h2>
      <p style="color: #4a4a4a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">
        Has sido dado/a de alta como socio/a en <strong>Triana Balonmano Vivero</strong>.
        Para completar tu inscripción, necesitamos tu consentimiento sobre el tratamiento de datos.
      </p>

      <div style="background-color: #f0f4f8; border-left: 4px solid #7a1f2b; padding: 16px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 14px;">Consentimiento de comunicaciones electrónicas</h3>
        <p style="color: #4a4a4a; margin: 0 0 12px 0; font-size: 13px; line-height: 1.5;">
          En cumplimiento del <strong>Reglamento General de Protección de Datos (RGPD)</strong> y la
          <strong>Ley Orgánica 3/2018</strong> de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD),
          te informamos que los datos proporcionados serán tratados por Triana Balonmano Vivero con la finalidad de:
        </p>
        <ul style="color: #4a4a4a; margin: 0 0 12px 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
          <li>Enviar comunicaciones sobre actividades, eventos y novedades del club por <strong>email</strong>.</li>
          <li>Enviar información relevante por <strong>WhatsApp</strong> al número facilitado.</li>
        </ul>
        <p style="color: #4a4a4a; margin: 0; font-size: 13px; line-height: 1.5;">
          Puedes retirar tu consentimiento en cualquier momento contactando con la directiva del club.
        </p>
      </div>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${linkConsentimiento}"
           style="display: inline-block; background-color: #7a1f2b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Revisar y dar mi consentimiento
        </a>
      </div>

      <p style="color: #8a8a8a; margin: 0; font-size: 12px; text-align: center; line-height: 1.5;">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <span style="color: #7a1f2b;">${linkConsentimiento}</span>
      </p>
    </div>
    <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center;">
      <p style="color: #8a8a8a; margin: 0; font-size: 11px;">
        Triana Balonmano Vivero · Club de Balonmano
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: socio.email,
    subject: 'Consentimiento de comunicaciones — Triana Balonmano Vivero',
    html,
  });
}

// ============ CRUD SOCIOS ============

export async function crearSocio(formData: FormData) {
  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const rateLimit = await rateLimiters.crearUsuario(usuario.id);
  if (!rateLimit.allowed) redirect('/socios?error=rate_limit');

  const validation = validateFormData(crearSocioSchema, formData);
  if (!validation.success) {
    return redirect(`/socios/nuevo?error=${encodeURIComponent(getFirstError(validation.errors))}`);
  }

  const {
    nombre,
    apellidos,
    dni,
    email,
    telefono,
    fecha_nacimiento,
    direccion,
    ciudad,
    codigo_postal,
    notas,
  } = validation.data;
  const numeroSocio = await generateNumeroSocio();
  const supabase = await createClient();

  const { data: socio, error } = await supabase
    .from('socios')
    .insert({
      numero_socio: numeroSocio,
      nombre,
      apellidos,
      dni: dni || null,
      email: email || null,
      telefono: telefono || null,
      fecha_nacimiento: fecha_nacimiento || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      codigo_postal: codigo_postal || null,
      notas: notas || null,
      email_verificado: true,
    })
    .select('id, token_consentimiento, email, nombre, apellidos')
    .single();

  if (error) {
    if (error.message?.includes('duplicate key')) {
      return redirect('/socios/nuevo?error=El+DNI+o+email+ya+está+registrado');
    }
    return redirect('/socios/nuevo?error=Error+al+crear+el+socio');
  }

  if (!socio) {
    return redirect('/socios/nuevo?error=Error+al+crear+el+socio');
  }

  await logCambio('socios', socio.id, 'crear', null, {
    nombre,
    apellidos,
    dni,
    email,
    numero_socio: numeroSocio,
  });

  if (socio.email) {
    enviarEmailConsentimiento(socio).catch((e) => {
      console.error('[socios] Error sending consent email:', e);
    });
  }

  redirect(`/socios/${socio.id}?creado=1`);
}

export async function actualizarSocio(socioId: string, formData: FormData) {
  if (!isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const validation = validateFormData(actualizarSocioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/socios/${socioId}/editar?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const {
    nombre,
    apellidos,
    dni,
    email,
    telefono,
    fecha_nacimiento,
    direccion,
    ciudad,
    codigo_postal,
    notas,
    activo,
  } = validation.data;
  const supabase = await createClient();

  const { data: previo } = await supabase
    .from('socios')
    .select('nombre, apellidos, dni, email')
    .eq('id', socioId)
    .single();

  const { error } = await supabase
    .from('socios')
    .update({
      nombre,
      apellidos,
      dni: dni || null,
      email: email || null,
      telefono: telefono || null,
      fecha_nacimiento: fecha_nacimiento || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      codigo_postal: codigo_postal || null,
      notas: notas || null,
      activo: activo ?? true,
      email_verificado: true,
    })
    .eq('id', socioId);

  if (error) {
    if (error.message?.includes('duplicate key')) {
      return redirect(`/socios/${socioId}/editar?error=El+DNI+o+email+ya+está+registrado`);
    }
    return redirect(`/socios/${socioId}/editar?error=Error+al+guardar`);
  }

  await logCambio('socios', socioId, 'actualizar', previo ?? null, {
    nombre,
    apellidos,
    dni,
    email,
  });
  redirect(`/socios/${socioId}?guardado=1`);
}

export async function eliminarSocio(socioId: string) {
  if (!isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !usuario.esMaster) redirect('/socios?error=no_autorizado');

  const supabase = await createClient();

  const { data: previo } = await supabase
    .from('socios')
    .select('nombre, apellidos, numero_socio')
    .eq('id', socioId)
    .single();

  const { error } = await supabase.from('socios').delete().eq('id', socioId);

  if (!error) {
    await logCambio('socios', socioId, 'eliminar', previo ?? null, null);
  }

  redirect('/socios?eliminado=1');
}

// ============ REENVIAR EMAIL DE CONSENTIMIENTO ============

export async function reenviarConsentimiento(socioId: string) {
  if (!isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const supabase = await createClient();
  const { data: socio } = await supabase
    .from('socios')
    .select('id, email, nombre, apellidos, token_consentimiento')
    .eq('id', socioId)
    .single();

  if (!socio?.email) {
    redirect(`/socios/${socioId}?error=El+socio+no+tiene+email+asignado`);
  }

  try {
    await enviarEmailConsentimiento(socio);
    redirect(`/socios/${socioId}?success=Email+de+consentimiento+reenviado`);
  } catch {
    redirect(`/socios/${socioId}?error=Error+al+enviar+el+email`);
  }
}

// ============ REENVIAR EMAIL DE VERIFICACIÓN ============

export async function reenviarVerificacionEmail(socioId: string) {
  if (!isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const supabase = await createClient();
  const { data: socio } = await supabase
    .from('socios')
    .select('id, email, nombre, apellidos, email_verificacion_token, email_verificado')
    .eq('id', socioId)
    .single();

  if (!socio?.email) {
    redirect(`/socios/${socioId}?error=El+socio+no+tiene+email+asignado`);
  }
  if (socio.email_verificado) {
    redirect(`/socios/${socioId}?error=El+email+ya+está+verificado`);
  }

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
      <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">Verifica tu email</h2>
      <p style="color: #4a4a4a; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">
        Hola <strong>${escapeHtml(socio.nombre!)} ${escapeHtml(socio.apellidos!)}</strong>,
        haz clic en el botón para verificar tu email.
      </p>
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${linkVerificacion}"
           style="display: inline-block; background-color: #7a1f2b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Verificar mi email
        </a>
      </div>
    </div>
    <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center;">
      <p style="color: #8a8a8a; margin: 0; font-size: 11px;">Triana Balonmano Vivero · Club de Balonmano</p>
    </div>
  </div>
</body>
</html>`;

  resend.emails
    .send({
      from: EMAIL_FROM,
      to: socio.email,
      subject: 'Verifica tu email — Triana Balonmano Vivero',
      html,
    })
    .catch((e) => {
      console.error('[socios] Error sending verification email:', e);
    });

  redirect(`/socios/${socioId}?success=Email+de+verificación+reenviado`);
}

// ============ CONSENTIMIENTO PÚBLICO ============

export async function registrarConsentimiento(
  token: string,
  acepta: boolean,
  ip: string,
  userAgent: string
) {
  const supabase = await createClient();

  const { data: socio } = await supabase
    .from('socios')
    .select('id, consentimiento_estado')
    .eq('token_consentimiento', token)
    .single();

  if (!socio) return { error: 'Socio no encontrado' };
  if (socio.consentimiento_estado !== 'pendiente')
    return { error: 'Ya has dado tu consentimiento anteriormente' };

  const { error } = await supabase
    .from('socios')
    .update({
      consentimiento_estado: acepta ? 'aceptado' : 'rechazado',
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_ip: ip,
      consentimiento_user_agent: userAgent,
    })
    .eq('token_consentimiento', token)
    .eq('consentimiento_estado', 'pendiente');

  if (error) return { error: 'Error al registrar el consentimiento' };

  await logCambio('socios', socio.id, 'actualizar', null, {
    consentimiento: acepta ? 'aceptado' : 'rechazado',
    ip,
  });

  return { ok: true, estado: acepta ? 'aceptado' : 'rechazado' };
}

// ============ CRUD PAGOS ============

export async function registrarPago(socioId: string, formData: FormData) {
  if (!isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const validation = validateFormData(crearPagoSocioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/socios/${socioId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const { concepto, importe, estado, fecha_pago, metodo_pago, referencia, notas } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.from('socios_pagos').insert({
    socio_id: socioId,
    concepto,
    importe,
    estado: estado || 'pendiente',
    fecha_pago: estado === 'pagado' ? fecha_pago || new Date().toISOString() : null,
    metodo_pago: metodo_pago || null,
    referencia: referencia || null,
    notas: notas || null,
  });

  if (error) {
    return redirect(`/socios/${socioId}?error=Error+al+registrar+el+pago`);
  }

  // Si el pago es "pagado", activar el socio automáticamente
  if (estado === 'pagado') {
    await supabase.from('socios').update({ activo: true }).eq('id', socioId);
  }

  await logCambio('socios_pagos', socioId, 'crear', null, { concepto, importe, estado });
  redirect(`/socios/${socioId}?guardado=1`);
}

export async function actualizarPago(pagoId: string, socioId: string, formData: FormData) {
  if (!isValidUUID(pagoId) || !isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const validation = validateFormData(actualizarPagoSocioSchema, formData);
  if (!validation.success) {
    return redirect(
      `/socios/${socioId}?error=${encodeURIComponent(getFirstError(validation.errors))}`
    );
  }

  const data = validation.data;
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (data.concepto !== undefined) updateData.concepto = data.concepto;
  if (data.importe !== undefined) updateData.importe = data.importe;
  if (data.estado !== undefined) {
    updateData.estado = data.estado;
    if (data.estado === 'pagado') {
      updateData.fecha_pago = data.fecha_pago || new Date().toISOString();
    } else {
      updateData.fecha_pago = null;
    }
  }
  if (data.metodo_pago !== undefined) updateData.metodo_pago = data.metodo_pago || null;
  if (data.referencia !== undefined) updateData.referencia = data.referencia || null;
  if (data.notas !== undefined) updateData.notas = data.notas || null;

  const { error } = await supabase.from('socios_pagos').update(updateData).eq('id', pagoId);

  if (error) {
    return redirect(`/socios/${socioId}?error=Error+al+actualizar+el+pago`);
  }

  // Si el pago cambia a "pagado", activar el socio automáticamente
  if (data.estado === 'pagado') {
    await supabase.from('socios').update({ activo: true }).eq('id', socioId);
  }

  redirect(`/socios/${socioId}?guardado=1`);
}

export async function eliminarPago(pagoId: string, socioId: string) {
  if (!isValidUUID(pagoId) || !isValidUUID(socioId)) redirect('/socios?error=id_invalido');

  const usuario = await getUsuarioActual();
  if (!usuario || !tienePermiso(usuario.permisos, 'socios.editar'))
    redirect('/socios?error=no_autorizado');

  const supabase = await createClient();
  await supabase.from('socios_pagos').delete().eq('id', pagoId);

  redirect(`/socios/${socioId}?eliminado=1`);
}
