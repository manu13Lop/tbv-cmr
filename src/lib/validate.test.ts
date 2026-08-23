import { describe, it, expect } from "vitest"
import { validateFormData, getFirstError } from "./validate"
import {
  crearJugadoraSchema,
  crearEquipoSchema,
  crearEventoSchema,
  crearUsuarioSchema,
  crearLesionSchema,
  crearArticuloSchema,
  crearMovimientoSchema,
  enviarMensajeSchema,
} from "./validations"

function createFormData(data: Record<string, string | boolean>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "boolean") {
      formData.set(key, value ? "on" : "")
    } else {
      formData.set(key, value)
    }
  }
  return formData
}

describe("validateFormData", () => {
  it("valida datos correctos de jugadora", () => {
    const formData = createFormData({
      nombre: "Ana",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
    })
    const result = validateFormData(crearJugadoraSchema, formData)
    expect(result.success).toBe(true)
  })

  it("retorna errores con datos inválidos", () => {
    const formData = createFormData({
      nombre: "",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
    })
    const result = validateFormData(crearJugadoraSchema, formData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.nombre).toBeDefined()
    }
  })

  it("maneja checkbox booleanos correctamente", () => {
    const formData = createFormData({
      nombre: "Equipo Test",
      categoria: "Juvenil",
      temporada: "2025-2026",
      federada: true,
    })
    const result = validateFormData(crearEquipoSchema, formData)
    expect(result.success).toBe(true)
  })

  it("valida email inválido", () => {
    const formData = createFormData({
      nombre: "Ana",
      apellidos: "García",
      fecha_nacimiento: "2010-01-15",
      email: "no-es-email",
    })
    const result = validateFormData(crearJugadoraSchema, formData)
    expect(result.success).toBe(false)
  })

  it("valida UUID en campos requeridos", () => {
    const formData = createFormData({
      equipo_id: "no-es-uuid",
      tipo: "entrenamiento",
      fecha_hora: "2026-07-17T18:00:00",
    })
    const result = validateFormData(crearEventoSchema, formData)
    expect(result.success).toBe(false)
  })

  it("acepta evento con UUID válido", () => {
    const formData = createFormData({
      equipo_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "entrenamiento",
      fecha_hora: "2026-07-17T18:00:00",
    })
    const result = validateFormData(crearEventoSchema, formData)
    expect(result.success).toBe(true)
  })
})

describe("validateFormData - crearUsuarioSchema", () => {
  it("valida usuario completo", () => {
    const formData = createFormData({
      nombre: "María",
      apellidos: "López",
      email: "maria@test.com",
      password: "123456",
      rol_id: "550e8400-e29b-41d4-a716-446655440000",
    })
    const result = validateFormData(crearUsuarioSchema, formData)
    expect(result.success).toBe(true)
  })

  it("rechaza contraseña corta", () => {
    const formData = createFormData({
      nombre: "María",
      apellidos: "López",
      email: "maria@test.com",
      password: "123",
      rol_id: "550e8400-e29b-41d4-a716-446655440000",
    })
    const result = validateFormData(crearUsuarioSchema, formData)
    expect(result.success).toBe(false)
  })
})

describe("validateFormData - crearLesionSchema", () => {
  it("valida lesión correctamente", () => {
    const formData = createFormData({
      jugadora_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "Esguince",
      fecha_lesion: "2026-01-15",
    })
    const result = validateFormData(crearLesionSchema, formData)
    expect(result.success).toBe(true)
  })
})

describe("validateFormData - crearArticuloSchema", () => {
  it("valida artículo correctamente", () => {
    const formData = createFormData({
      nombre: "Balón",
      categoria: "Material",
      unidad: "unidad",
    })
    const result = validateFormData(crearArticuloSchema, formData)
    expect(result.success).toBe(true)
  })
})

describe("validateFormData - crearMovimientoSchema", () => {
  it("valida movimiento correctamente", () => {
    const formData = createFormData({
      articulo_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "entrada",
      cantidad: "5",
    })
    const result = validateFormData(crearMovimientoSchema, formData)
    expect(result.success).toBe(true)
  })

  it("rechaza cantidad cero", () => {
    const formData = createFormData({
      articulo_id: "550e8400-e29b-41d4-a716-446655440000",
      tipo: "entrada",
      cantidad: "0",
    })
    const result = validateFormData(crearMovimientoSchema, formData)
    expect(result.success).toBe(false)
  })
})

describe("validateFormData - enviarMensajeSchema", () => {
  it("valida mensaje correctamente", () => {
    const formData = createFormData({
      equipo_id: "550e8400-e29b-41d4-a716-446655440000",
      asunto: "Entrenamiento",
      cuerpo: "Mañana hay entrenamiento a las 10",
    })
    const result = validateFormData(enviarMensajeSchema, formData)
    expect(result.success).toBe(true)
  })
})

describe("getFirstError", () => {
  it("retorna el primer error", () => {
    const errors = {
      nombre: ["El nombre es obligatorio"],
      email: ["Email no válido"],
    }
    expect(getFirstError(errors)).toBe("El nombre es obligatorio")
  })

  it("retorna mensaje por defecto si no hay errores", () => {
    expect(getFirstError({})).toBe("Error de validación")
  })
})
