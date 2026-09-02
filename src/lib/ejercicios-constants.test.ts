import { describe, it, expect } from 'vitest';
import {
  SECCIONES_PRINCIPALES,
  SECCIONES_SECUNDARIAS,
  ASPECTOS_INDIVIDUALES,
  NIVELES_DIFICULTAD,
} from './ejercicios-constants';

describe('ejercicios-constants', () => {
  describe('SECCIONES_PRINCIPALES', () => {
    it('has correct structure', () => {
      SECCIONES_PRINCIPALES.forEach((s) => {
        expect(s).toHaveProperty('value');
        expect(s).toHaveProperty('label');
        expect(typeof s.value).toBe('string');
        expect(typeof s.label).toBe('string');
      });
    });

    it('has all required sections', () => {
      const values = SECCIONES_PRINCIPALES.map((s) => s.value);
      expect(values).toContain('ataque');
      expect(values).toContain('defensa');
      expect(values).toContain('porteria');
      expect(values).toContain('contraataque_1a');
      expect(values).toContain('otros');
    });

    it('has no duplicate values', () => {
      const values = SECCIONES_PRINCIPALES.map((s) => s.value);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('SECCIONES_SECUNDARIAS', () => {
    it('has correct structure', () => {
      SECCIONES_SECUNDARIAS.forEach((s) => {
        expect(s).toHaveProperty('value');
        expect(s).toHaveProperty('label');
      });
    });

    it('has no duplicate values', () => {
      const values = SECCIONES_SECUNDARIAS.map((s) => s.value);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('ASPECTOS_INDIVIDUALES', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(ASPECTOS_INDIVIDUALES)).toBe(true);
      expect(ASPECTOS_INDIVIDUALES.length).toBeGreaterThan(0);
      ASPECTOS_INDIVIDUALES.forEach((a) => {
        expect(typeof a).toBe('string');
        expect(a.length).toBeGreaterThan(0);
      });
    });

    it('contains key handball aspects', () => {
      expect(ASPECTOS_INDIVIDUALES).toContain('Calidad de pase');
      expect(ASPECTOS_INDIVIDUALES).toContain('Lanzamiento');
      expect(ASPECTOS_INDIVIDUALES).toContain('Velocidad');
      expect(ASPECTOS_INDIVIDUALES).toContain('Marcaje');
    });

    it('has no duplicates', () => {
      expect(new Set(ASPECTOS_INDIVIDUALES).size).toBe(ASPECTOS_INDIVIDUALES.length);
    });
  });

  describe('NIVELES_DIFICULTAD', () => {
    it('has 3 levels', () => {
      expect(NIVELES_DIFICULTAD).toHaveLength(3);
    });

    it('contains basico, intermedio, avanzado', () => {
      const values = NIVELES_DIFICULTAD.map((n) => n.value);
      expect(values).toContain('basico');
      expect(values).toContain('intermedio');
      expect(values).toContain('avanzado');
    });
  });
});
