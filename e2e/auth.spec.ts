import { test, expect } from "@playwright/test"

test.describe("Login", () => {
  test("redirige a login cuando no autenticado", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("muestra formulario de login", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("muestra error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "noexiste@test.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=Email o contraseña incorrectos")).toBeVisible()
  })
})

test.describe("Health Check", () => {
  test("endpoint /api/health responde OK", async ({ request }) => {
    const response = await request.get("/api/health")
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status).toBe("healthy")
    expect(data.checks.database.status).toBe("ok")
  })
})

test.describe("Navigación", () => {
  test("login page carga correctamente", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveTitle(/TBV/)
  })
})
