import { describe, it, expect } from 'vitest';
import { generarICS, generarLinkGoogleCalendar } from './ics';

describe('generarICS', () => {
  it('genera un archivo iCal válido con todos los campos', () => {
    const result = generarICS({
      uid: 'test-uid-123',
      titulo: 'Entrenamiento vs Rival',
      descripcion: 'Sesión de tiro',
      lugar: 'Pabellón Triana',
      inicio: new Date('2026-09-15T18:00:00Z'),
      duracionMinutos: 90,
    });

    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
    expect(result).toContain('BEGIN:VEVENT');
    expect(result).toContain('END:VEVENT');
    expect(result).toContain('UID:test-uid-123');
    expect(result).toContain('SUMMARY:Entrenamiento vs Rival');
    expect(result).toContain('DESCRIPTION:Sesión de tiro');
    expect(result).toContain('LOCATION:Pabellón Triana');
    expect(result).toContain('VERSION:2.0');
    expect(result).toContain('PRODID:-//TBV//Convocatorias//ES');
  });

  it('calcula la hora de fin sumando la duración', () => {
    const result = generarICS({
      uid: 'uid',
      titulo: 'Test',
      descripcion: '',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
      duracionMinutos: 60,
    });

    expect(result).toContain('DTSTART:20260915T180000Z');
    expect(result).toContain('DTEND:20260915T190000Z');
  });

  it('usa duración por defecto de 90 minutos', () => {
    const result = generarICS({
      uid: 'uid',
      titulo: 'Test',
      descripcion: '',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
    });

    expect(result).toContain('DTEND:20260915T193000Z');
  });

  it('escapa saltos de línea en la descripción', () => {
    const result = generarICS({
      uid: 'uid',
      titulo: 'Test',
      descripcion: 'Línea 1\nLínea 2\nLínea 3',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
    });

    expect(result).toContain('DESCRIPTION:Línea 1\\nLínea 2\\nLínea 3');
    expect(result).not.toContain('Línea 1\n');
  });

  it('incluye DTSTAMP con formato correcto', () => {
    const result = generarICS({
      uid: 'uid',
      titulo: 'Test',
      descripcion: '',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
    });

    expect(result).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
  });
});

describe('generarLinkGoogleCalendar', () => {
  it('genera un link válido de Google Calendar', () => {
    const link = generarLinkGoogleCalendar({
      titulo: 'Entrenamiento',
      descripcion: 'Sesion tactica',
      lugar: 'Pabellon',
      inicio: new Date('2026-09-15T18:00:00Z'),
      duracionMinutos: 90,
    });

    expect(link).toContain('https://calendar.google.com/calendar/render?');
    expect(link).toContain('action=TEMPLATE');
    expect(link).toContain('text=Entrenamiento');
    expect(link).toContain('details=Sesion');
    expect(link).toContain('location=Pabellon');
  });

  it('genera fechas en formato iCal para Google', () => {
    const link = generarLinkGoogleCalendar({
      titulo: 'Test',
      descripcion: '',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
      duracionMinutos: 60,
    });

    expect(link).toContain('dates=20260915T180000Z%2F20260915T190000Z');
  });

  it('usa duración por defecto de 90 minutos', () => {
    const link = generarLinkGoogleCalendar({
      titulo: 'Test',
      descripcion: '',
      lugar: '',
      inicio: new Date('2026-09-15T18:00:00Z'),
    });

    expect(link).toContain('20260915T193000Z');
  });
});
