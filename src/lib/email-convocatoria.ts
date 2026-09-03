import { generarICS, generarLinkGoogleCalendar } from '@/lib/ics';
import { resend, EMAIL_FROM } from '@/lib/resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function enviarEmailConvocatoria({
  destinatarioEmail,
  destinatarioNombre,
  titulo,
  lugar,
  inicio,
  rival,
  observaciones,
  uid,
}: {
  destinatarioEmail: string;
  destinatarioNombre: string;
  titulo: string;
  lugar: string;
  inicio: Date;
  rival?: string | null;
  observaciones?: string | null;
  uid: string;
}) {
  const descripcion = `${titulo}.${observaciones ? '\nObservaciones: ' + observaciones : ''}`;

  const icsContent = generarICS({
    uid,
    titulo,
    descripcion,
    lugar,
    inicio,
  });

  const linkCalendario = generarLinkGoogleCalendar({
    titulo,
    descripcion,
    lugar,
    inicio,
  });

  const fechaFormateada = inicio.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const safe = {
    titulo: escapeHtml(titulo),
    nombre: escapeHtml(destinatarioNombre),
    lugar: escapeHtml(lugar || 'Por confirmar'),
    rival: rival ? escapeHtml(rival) : null,
    observaciones: observaciones ? escapeHtml(observaciones) : null,
  };

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px;">
      <h2 style="color:#0f5132;">Convocatoria: ${safe.titulo}</h2>
      <p>Hola ${safe.nombre},</p>
      <p>Quedas convocada al siguiente evento:</p>
      <ul>
        <li><strong>Fecha:</strong> ${fechaFormateada}</li>
        <li><strong>Lugar:</strong> ${safe.lugar}</li>
        ${safe.rival ? `<li><strong>Rival:</strong> ${safe.rival}</li>` : ''}
      </ul>
      ${safe.observaciones ? `<p><strong>Observaciones:</strong><br>${safe.observaciones}</p>` : ''}
      <p><a href="${linkCalendario}" target="_blank">Añadir a Google Calendar</a></p>
      <p>Adjuntamos también el archivo .ics para añadirlo a cualquier calendario.</p>
      <p style="color:#666; font-size:12px;">Triana Balonmano Vivero</p>
    </div>
  `;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: destinatarioEmail,
    subject: `Convocatoria: ${safe.titulo} - ${fechaFormateada}`,
    html: htmlBody,
    attachments: [
      {
        filename: 'evento.ics',
        content: Buffer.from(icsContent).toString('base64'),
      },
    ],
  });
}
