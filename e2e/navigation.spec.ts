import { test, expect } from '@playwright/test';

test.describe('Navegación entre módulos', () => {
  test('redirige a login desde cualquier ruta protegida', async ({ page }) => {
    const rutas = [
      '/jugadoras',
      '/convocatorias',
      '/entrenadores',
      '/sanitario',
      '/scouting',
      '/logistica',
      '/formacion',
      '/mensajes',
      '/usuarios',
    ];

    for (const ruta of rutas) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('página 404 muestra contenido', async ({ page }) => {
    const response = await page.goto('/ruta-que-no-existe');
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Login form UX', () => {
  test('login form muestra todos los campos', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login button tiene texto', async ({ page }) => {
    await page.goto('/login');
    const button = page.locator('button[type="submit"]');
    await expect(button).not.toBeEmpty();
  });
});

test.describe('API Health', () => {
  test('health check retorna estructura completa', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('checks');
    expect(data.checks).toHaveProperty('database');
  });

  test('health check status es healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
