import { test, expect } from '@playwright/test';

test.describe('User Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/users');
  });

  test('renders user table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  });

  test('navigates to create user', async ({ page }) => {
    await page.getByRole('link', { name: /create user/i }).click();
    await page.waitForURL('/dashboard/users/create');
  });

  test('delete asks for confirmation', async ({ page }) => {
    page.on('dialog', dialog => dialog.dismiss()); // cancel
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.getByRole('table')).toBeVisible();
  });
});