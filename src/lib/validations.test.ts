import { describe, it, expect } from "vitest"
import {
  crearJugadoraSchema,
  crearEquipoSchema,
  crearEventoSchema,
  crearEntrenadorSchema,
  crearEjercicioSchema,
} from "./validations"

describe("crearJugadoraSchema", () => {
  it("acepta datos válidos", () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: "Ana",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: "",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza email inválido", () => {
    const result = crearJugadoraSchema.safeParse({
      nombre: "Ana",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
      email: "no-es-email",
    })
    expect(result.success).toBe(false)
  })
})

describe("crearEquipoSchema", () => {
  it("acepta datos válidos", () => {
    const result = crearEquipoSchema.safeParse({
      nombre: "Juvenil A Femenino",
      categoria: "Juvenil",
      temporada: "2025-2026",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    const result = crearEquipoSchema.safeParse({
      nombre: "",
      categoria: "Juvenil",
      temporada: "2025-2026",
    })
    expect(result.success).toBe(false)
  })
})

describe("crearEventoSchema", () => {
  it("acepta datos válidos", () => {
    const result = crearEventoSchema.safeParse({
      equipo_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "entrenamiento",
      fecha_hora: "2026-07-17T18:00:00",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza tipo inválido", () => {
    const result = crearEventoSchema.safeParse({
      equipo_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "tipo_invalido",
      fecha_hora: "2026-07-17T18:00:00",
    })
    expect(result.success).toBe(false)
  })
})

describe("crearEntrenadorSchema", () => {
  it("acepta datos válidos", () => {
    const result = crearEntrenadorSchema.safeParse({
      nombre: "Manuel",
      apellidos: "López",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza apellidos vacíos", () => {
    const result = crearEntrenadorSchema.safeParse({
      nombre: "Manuel",
      apellidos: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("crearEjercicioSchema", () => {
  it("acepta datos válidos", () => {
    const result = crearEjercicioSchema.safeParse({
      categoria: "táctico",
      titulo: "Circuito de pases",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza categoría inválida", () => {
    const result = crearEjercicioSchema.safeParse({
      categoria: "invalida",
      titulo: "Circuito de pases",
    })
    expect(result.success).toBe(false)
  })

  it("acepta todas las categorías válidas", () => {
    const categorias = ["táctico", "técnica_individual", "portero", "físico"]
    for (const cat of categorias) {
      const result = crearEjercicioSchema.safeParse({
        categoria: cat,
        titulo: "Test",
      })
      expect(result.success).toBe(true)
    }
  })
})
