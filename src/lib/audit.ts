import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('audit');

type AuditAccion = 'crear' | 'actualizar' | 'eliminar' | 'agregar' | 'quitar';

export async function logCambio(
  tabla: string,
  registroId: string | null,
  accion: AuditAccion,
  datosAnteriores?: Record<string, unknown> | null,
  datosNuevos?: Record<string, unknown> | null
) {
  const admin = createAdminClient();
  const hdrs = await headers();
  const userId = hdrs.get('x-user-id');

  try {
    await admin.from('audit_log').insert({
      usuario_id: userId ?? null,
      tabla,
      registro_id: registroId,
      accion,
      datos_anteriores: datosAnteriores ?? null,
      datos_nuevos: datosNuevos ?? null,
    });
    log.debug({ tabla, registroId, accion, userId }, 'Audit log registrado');
  } catch (err) {
    log.error({ err, tabla, registroId, accion }, 'Error al registrar audit log');
  }
}
