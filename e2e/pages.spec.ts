import { test, expect } from "@playwright/test"

test.describe("Páginas principales", () => {
  test("login page carga sin errores de consola críticos", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))

    await page.goto("/login")
    await page.waitForLoadState("networkidle")

    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("hydrat")
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test("health check no retorna errores", async ({ request }) => {
    const response = await request.get("/api/health")
    const data = await response.json()
    expect(data.status).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })
})

test.describe("Formularios", () => {
  test("login form tiene campos requeridos", async ({ page }) => {
    await page.goto("/login")

    const email = page.locator('input[type="email"]')
    const password = page.locator('input[type="password"]')

    await expect(email).toHaveAttribute("required", "")
    await expect(password).toHaveAttribute("required", "")
  })
})
