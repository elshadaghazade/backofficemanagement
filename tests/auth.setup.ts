import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByLabel('Email address').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
  await page.context().storageState({ path: authFile });
});