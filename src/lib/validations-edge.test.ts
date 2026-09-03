import { describe, it, expect } from 'vitest';
import {
  crearJugadoraSchema,
  crearEquipoSchema,
  crearEventoSchema,
  crearUsuarioSchema,
  crearLesionSchema,
  crearSesionEntrenamientoSchema,
  crearFichaScoutingSchema,
} from './validations';

describe('validations - crearJugadoraSchema', () => {
  it('accepts valid data', () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: 'Ana',
      apellidos: 'Garcia',
      fecha_nacimiento: '2010-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: '',
      apellidos: 'Garcia',
      fecha_nacimiento: '2010-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional email', () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: 'Ana',
      apellidos: 'Garcia',
      fecha_nacimiento: '2010-01-15',
      email: 'ana@test.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: 'Ana',
      apellidos: 'Garcia',
      fecha_nacimiento: '2010-01-15',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('validations - crearEquipoSchema', () => {
  it('accepts valid team', () => {
    const result = crearEquipoSchema.safeParse({
      nombre: 'Juvenil A',
      categoria: 'Juvenil',
      temporada: '2025-2026',
    });
    expect(result.success).toBe(true);
  });

  it('accepts federada field', () => {
    const result = crearEquipoSchema.safeParse({
      nombre: 'Juvenil A',
      categoria: 'Juvenil',
      temporada: '2025-2026',
      federada: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('validations - crearEventoSchema', () => {
  it('rejects invalid UUID', () => {
    const result = crearEventoSchema.safeParse({
      equipo_id: 'not-uuid',
      tipo: 'entrenamiento',
      fecha_hora: '2026-07-17T18:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid UUID', () => {
    const result = crearEventoSchema.safeParse({
      equipo_id: '550e8400-e29b-41d4-a716-446655440000',
      tipo: 'entrenamiento',
      fecha_hora: '2026-07-17T18:00:00',
    });
    expect(result.success).toBe(true);
  });
});

describe('validations - crearUsuarioSchema', () => {
  it('rejects short password', () => {
    const result = crearUsuarioSchema.safeParse({
      nombre: 'Maria',
      apellidos: 'Lopez',
      email: 'maria@test.com',
      password: '123',
      rol_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid password', () => {
    const result = crearUsuarioSchema.safeParse({
      nombre: 'Maria',
      apellidos: 'Lopez',
      email: 'maria@test.com',
      password: '12345678',
      rol_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });
});

describe('validations - crearLesionSchema', () => {
  it('accepts valid lesion', () => {
    const result = crearLesionSchema.safeParse({
      jugadora_id: '550e8400-e29b-41d4-a716-446655440000',
      tipo: 'Esguince',
      fecha_lesion: '2026-01-15',
    });
    expect(result.success).toBe(true);
  });
});

describe('validations - crearSesionEntrenamientoSchema', () => {
  it('rejects empty titulo', () => {
    const result = crearSesionEntrenamientoSchema.safeParse({
      titulo: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('validations - crearFichaScoutingSchema', () => {
  it('accepts valid ficha', () => {
    const result = crearFichaScoutingSchema.safeParse({
      jugadora_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });
});
