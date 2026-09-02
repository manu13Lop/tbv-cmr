import { describe, it, expect, vi } from 'vitest';

describe('ejercicios-constants', () => {
  it('exports expected constants', async () => {
    const mod = await import('./ejercicios-constants');
    expect(mod.SECCIONES_PRINCIPALES.length).toBeGreaterThan(0);
    expect(mod.SECCIONES_SECUNDARIAS.length).toBeGreaterThan(0);
    expect(mod.ASPECTOS_INDIVIDUALES.length).toBeGreaterThan(0);
    expect(mod.NIVELES_DIFICULTAD).toHaveLength(3);
  });
});

describe('scouting-criterios', () => {
  it('exports CRITERIOS_SCOUTING', async () => {
    const { CRITERIOS_SCOUTING } = await import('./scouting-criterios');
    expect(Array.isArray(CRITERIOS_SCOUTING)).toBe(true);
    expect(CRITERIOS_SCOUTING.length).toBeGreaterThan(0);
    CRITERIOS_SCOUTING.forEach((c: { clave: string; etiqueta: string }) => {
      expect(typeof c.clave).toBe('string');
      expect(typeof c.etiqueta).toBe('string');
    });
  });

  it('getCriteriosScouting returns array', async () => {
    vi.mock('./supabase-server', () => ({
      createClient: vi.fn().mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: 'mock' } }),
            }),
          }),
        }),
      }),
    }));

    const { getCriteriosScouting } = await import('./scouting-criterios');
    const result = await getCriteriosScouting();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
