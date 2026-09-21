import { test, expect } from '@playwright/test';
test('browse, cascade multiple filters, search, paginate, and recover from empty results', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('Showing 1–20 of 3,503')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Showing 21–40 of 3,503')).toBeVisible();
  await page.getByLabel('Rows per page').selectOption('50');
  await expect(page.locator('tbody tr')).toHaveCount(50);
  await page.getByLabel('Jump to page').fill('71');
  await page.getByLabel('Jump to page').press('Enter');
  await expect(page.getByText('Showing 3,501–3,503 of 3,503')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Genres', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rock', exact: true }).check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByLabel('Jump to page')).toHaveValue('1');
  await page.getByRole('button', { name: 'Artists', exact: true }).click();
  await page.getByRole('checkbox', { name: 'AC/DC', exact: true }).check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Showing 1–18 of 18')).toBeVisible();
  await page.getByRole('button', { name: 'Albums', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.chips button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Genres 1', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Jazz', exact: true }).check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.chips button')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Artists', exact: true })).toBeEnabled();
  await page
    .getByRole('textbox', { name: 'Search tracks, artists, albums, or composers' })
    .fill('AC/DC');
  await expect(page.getByText('Showing 1–18 of 18')).toBeVisible();
  await expect(page.locator('.chips button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search tracks, artists, albums, or composers' })
    .fill('AC/DC');
  await expect(page.getByText('Showing 1–18 of 18')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Search tracks, artists, albums, or composers' })
    .fill('no-such-track-xyz');
  await expect(page.getByRole('heading', { name: 'No tracks found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.getByText('Showing 1–50 of 3,503')).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile layout, keyboard filter close, and auth preview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Showing 1–20 of 3,503')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Genres', exact: true }).click();
  await expect(page.getByLabel('Find genres')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Find genres')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Make room for discovery.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/signup-mobile.png', fullPage: true });
});
test('API rejects malformed parameters', async ({ request }) => {
  for (const query of ['page=-1', 'size=999', 'genres=1;drop', 'q=' + 'a'.repeat(201)])
    expect((await request.get(`/api/catalogue?${query}`)).status()).toBe(400);
});
