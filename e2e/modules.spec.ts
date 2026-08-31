import { test, expect } from '@playwright/test';

test.describe('Módulo Sanitario', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/sanitario');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Scouting', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/scouting');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Logística', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/logistica');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Formación', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/formacion');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Convocatorias', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/convocatorias');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Mensajes', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/mensajes');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Entrenadores', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/entrenadores');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Usuarios', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Módulo Jugadoras', () => {
  test('redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/jugadoras');
    await expect(page).toHaveURL(/\/login/);
  });
});
