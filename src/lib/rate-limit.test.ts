import { describe, it, expect, beforeEach, vi } from "vitest"
import { checkInMemoryRateLimit } from "./rate-limit"

describe("checkInMemoryRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("permite la primera petición", async () => {
    const result = await checkInMemoryRateLimit("test-ip", 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("permite múltiples peticiones dentro del límite", async () => {
    for (let i = 0; i < 4; i++) {
      const result = await checkInMemoryRateLimit("test-ip-2", 5, 60000)
      expect(result.allowed).toBe(true)
    }
    const lastResult = await checkInMemoryRateLimit("test-ip-2", 5, 60000)
    expect(lastResult.allowed).toBe(true)
    expect(lastResult.remaining).toBe(0)
  })

  it("bloquea cuando se excede el límite", async () => {
    for (let i = 0; i < 5; i++) {
      await checkInMemoryRateLimit("test-ip-3", 5, 60000)
    }
    const blockedResult = await checkInMemoryRateLimit("test-ip-3", 5, 60000)
    expect(blockedResult.allowed).toBe(false)
    expect(blockedResult.remaining).toBe(0)
  })

  it("resetea después de la ventana de tiempo", async () => {
    const identifier = "test-ip-4"
    for (let i = 0; i < 5; i++) {
      await checkInMemoryRateLimit(identifier, 5, 60000)
    }
    const blockedResult = await checkInMemoryRateLimit(identifier, 5, 60000)
    expect(blockedResult.allowed).toBe(false)

    vi.advanceTimersByTime(60001)

    const resetResult = await checkInMemoryRateLimit(identifier, 5, 60000)
    expect(resetResult.allowed).toBe(true)
    expect(resetResult.remaining).toBe(4)
  })

  it("identificadores diferentes no comparten estado", async () => {
    for (let i = 0; i < 5; i++) {
      await checkInMemoryRateLimit("ip-a", 5, 60000)
    }
    const blockedA = await checkInMemoryRateLimit("ip-a", 5, 60000)
    expect(blockedA.allowed).toBe(false)

    const allowedB = await checkInMemoryRateLimit("ip-b", 5, 60000)
    expect(allowedB.allowed).toBe(true)
  })

  it("ventanas diferentes funcionan correctamente", async () => {
    const identifier = "test-ip-5"
    await checkInMemoryRateLimit(identifier, 3, 30000)
    await checkInMemoryRateLimit(identifier, 3, 30000)
    const result = await checkInMemoryRateLimit(identifier, 3, 30000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)

    const blocked = await checkInMemoryRateLimit(identifier, 3, 30000)
    expect(blocked.allowed).toBe(false)
  })
})
