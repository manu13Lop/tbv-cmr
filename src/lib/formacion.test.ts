import { describe, it, expect } from 'vitest';
import {
  getCategoriaLabel,
  getCategoriaColor,
  getNivelLabel,
  CATEGORIAS_FORMACION,
  NIVELES_FORMACION,
} from './formacion';

describe('getCategoriaLabel', () => {
  it('devuelve la etiqueta para cada categoría', () => {
    expect(getCategoriaLabel('tactica')).toBe('Táctica');
    expect(getCategoriaLabel('fisico')).toBe('Físico');
    expect(getCategoriaLabel('reglamento')).toBe('Reglamento');
    expect(getCategoriaLabel('videos')).toBe('Vídeos');
    expect(getCategoriaLabel('psicologia')).toBe('Psicología');
    expect(getCategoriaLabel('liderazgo')).toBe('Liderazgo');
  });

  it('devuelve el valor original si la categoría no existe', () => {
    expect(getCategoriaLabel('no_existe')).toBe('no_existe');
  });
});

describe('getCategoriaColor', () => {
  it('devuelve clases CSS para categorías conocidas', () => {
    const color = getCategoriaColor('tactica');
    expect(color).toContain('bg-primary/10');
    expect(color).toContain('text-primary');
  });

  it('devuelve color por defecto para categoría desconocida', () => {
    const color = getCategoriaColor('desconocida');
    expect(color).toContain('bg-muted');
    expect(color).toContain('text-muted-foreground');
  });
});

describe('getNivelLabel', () => {
  it('devuelve la etiqueta para cada nivel', () => {
    expect(getNivelLabel('principiante')).toBe('Principiante');
    expect(getNivelLabel('intermedio')).toBe('Intermedio');
    expect(getNivelLabel('avanzado')).toBe('Avanzado');
  });

  it('devuelve el valor original si el nivel no existe', () => {
    expect(getNivelLabel('expert')).toBe('expert');
  });
});

describe('CATEGORIAS_FORMACION', () => {
  it('tiene 6 categorías', () => {
    expect(CATEGORIAS_FORMACION).toHaveLength(6);
  });

  it('cada categoría tiene value, label, color e icon', () => {
    for (const cat of CATEGORIAS_FORMACION) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.color).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });

  it('los values son únicos', () => {
    const values = CATEGORIAS_FORMACION.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('NIVELES_FORMACION', () => {
  it('tiene 3 niveles', () => {
    expect(NIVELES_FORMACION).toHaveLength(3);
  });

  it('cada nivel tiene value y label', () => {
    for (const nivel of NIVELES_FORMACION) {
      expect(nivel.value).toBeTruthy();
      expect(nivel.label).toBeTruthy();
    }
  });
});
