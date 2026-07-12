import { expect, type Locator, type Page } from '@playwright/test'

export async function loginByUi(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByPlaceholder('Username').fill(username)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/$/)
}

export function bookmarkCard(page: Page, memo: string): Locator {
  return page.getByTestId('bookmark-card').filter({ hasText: memo }).first()
}
