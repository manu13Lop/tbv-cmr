import { describe, it, expect, vi, beforeEach } from "vitest"
import { getRolNombre, clearRolesCache } from "./roles"

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}))

describe("roles", () => {
  beforeEach(() => {
    clearRolesCache()
    vi.clearAllMocks()
  })

  it("getRolNombre retorna nombre correcto", () => {
    const roles = [
      { id: "1", nombre: "entrenador" },
      { id: "2", nombre: "sanitario" },
    ]
    expect(getRolNombre(roles, "1")).toBe("entrenador")
    expect(getRolNombre(roles, "2")).toBe("sanitario")
  })

  it("getRolNombre retorna 'Sin rol' para null", () => {
    const roles = [{ id: "1", nombre: "entrenador" }]
    expect(getRolNombre(roles, null)).toBe("Sin rol")
  })

  it("getRolNombre retorna 'Sin rol' para ID inexistente", () => {
    const roles = [{ id: "1", nombre: "entrenador" }]
    expect(getRolNombre(roles, "999")).toBe("Sin rol")
  })
})
