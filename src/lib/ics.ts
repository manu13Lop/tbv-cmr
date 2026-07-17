function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

export function generarICS({
  uid,
  titulo,
  descripcion,
  lugar,
  inicio,
  duracionMinutos = 90,
}: {
  uid: string
  titulo: string
  descripcion: string
  lugar: string
  inicio: Date
  duracionMinutos?: number
}): string {
  const fin = new Date(inicio.getTime() + duracionMinutos * 60000)

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TBV//Convocatorias//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(inicio)}`,
    `DTEND:${formatICSDate(fin)}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion.replace(/\n/g, "\\n")}`,
    `LOCATION:${lugar}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export function generarLinkGoogleCalendar({
  titulo,
  descripcion,
  lugar,
  inicio,
  duracionMinutos = 90,
}: {
  titulo: string
  descripcion: string
  lugar: string
  inicio: Date
  duracionMinutos?: number
}): string {
  const fin = new Date(inicio.getTime() + duracionMinutos * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${fmt(inicio)}/${fmt(fin)}`,
    details: descripcion,
    location: lugar,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}