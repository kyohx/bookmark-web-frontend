import { expect, test } from '@playwright/test'
import {
  adminCredentials,
  clearAllBookmarks,
  createBookmarks,
  ensureReadOnlyUser,
  readOnlyCredentials,
} from './support/api'
import { bookmarkCard, loginByUi } from './support/ui'

function createBookmarkPayload(name: string, tags: string[]): {
  url: string
  memo: string
  tags: string[]
} {
  const slug = name.toLowerCase().replace(/\s+/g, '-')

  return {
    url: `https://example.com/${slug}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    memo: name,
    tags,
  }
}

test('shows an error on invalid login', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Username').fill('wrong-user')
  await page.getByPlaceholder('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page.getByText('Invalid username or password')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('allows an admin user to add, filter, edit, delete, and logout', async ({ page, request }) => {
  await clearAllBookmarks(request)
  await createBookmarks(request, [
    createBookmarkPayload('Existing Seed Bookmark', ['seed', 'shared']),
  ])

  await loginByUi(page, adminCredentials.username, adminCredentials.password)
  await expect(bookmarkCard(page, 'Existing Seed Bookmark')).toBeVisible()

  await page.getByRole('button', { name: 'Add Bookmark' }).click()
  await expect(page.getByRole('dialog', { name: 'Add Bookmark' }).getByLabel('URL *')).toBeVisible()

  await page.getByLabel('URL *').fill(createBookmarkPayload('Created From UI', ['ui', 'beta']).url)
  await page.getByLabel('Memo *').fill('Created From UI')
  await page.getByLabel('Tags (comma separated) *').fill('ui, beta')
  await page.getByRole('button', { name: 'Save' }).click()

  const addConfirmation = page.getByRole('dialog').filter({ hasText: 'Do you want to add this bookmark?' })
  await addConfirmation.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog', { name: 'Add Bookmark' }).getByLabel('Memo *')).toHaveValue('Created From UI')

  await page.getByRole('button', { name: 'Save' }).click()
  await addConfirmation.getByRole('button', { name: 'Add' }).click()
  await page.reload()
  await expect(bookmarkCard(page, 'Created From UI')).toBeVisible()

  await page.getByPlaceholder('Filter by tag...').fill('beta')
  await expect(bookmarkCard(page, 'Created From UI')).toBeVisible()
  await expect(bookmarkCard(page, 'Existing Seed Bookmark')).toHaveCount(0)

  await page.getByPlaceholder('Filter by tag...').clear()
  await expect(bookmarkCard(page, 'Existing Seed Bookmark')).toBeVisible()

  await bookmarkCard(page, 'Created From UI').getByRole('button', { name: 'Edit Created From UI' }).click()
  const editDialog = page.getByRole('dialog', { name: 'Edit Bookmark' })
  await expect(editDialog.getByLabel('Memo *')).toHaveValue('Created From UI')
  await expect(editDialog.getByLabel('URL *')).toBeDisabled()

  await editDialog.getByLabel('Memo *').fill('Created From UI Updated')
  await editDialog.getByLabel('Tags (comma separated) *').fill('ui, gamma')
  await editDialog.getByRole('button', { name: 'Save' }).click()

  const saveConfirmation = page
    .getByRole('dialog')
    .filter({ hasText: 'Do you want to save the changes to this bookmark?' })

  await saveConfirmation.getByRole('button', { name: 'Cancel' }).click()
  await expect(editDialog.getByLabel('Memo *')).toHaveValue('Created From UI Updated')

  await editDialog.getByRole('button', { name: 'Save' }).click()
  await saveConfirmation.getByRole('button', { name: 'Save Changes' }).click()
  await page.reload()
  await expect(bookmarkCard(page, 'Created From UI Updated')).toBeVisible()

  await bookmarkCard(page, 'Created From UI Updated')
    .getByRole('button', { name: 'Delete Created From UI Updated' })
    .click()

  const deleteConfirmation = page.getByRole('dialog', { name: 'Delete Bookmark' })
  await deleteConfirmation.getByRole('button', { name: 'Cancel' }).click()
  await expect(bookmarkCard(page, 'Created From UI Updated')).toBeVisible()

  await bookmarkCard(page, 'Created From UI Updated')
    .getByRole('button', { name: 'Delete Created From UI Updated' })
    .click()
  await deleteConfirmation.getByRole('button', { name: 'Delete' }).click()
  await page.reload()
  await expect(bookmarkCard(page, 'Created From UI Updated')).toHaveCount(0)

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('paginates bookmark cards', async ({ page, request }) => {
  await clearAllBookmarks(request)
  await createBookmarks(
    request,
    Array.from({ length: 13 }, (_, index) =>
      createBookmarkPayload(`Pagination Bookmark ${index + 1}`, ['pagination']),
    ),
  )

  await loginByUi(page, adminCredentials.username, adminCredentials.password)

  await expect(page.getByTestId('bookmark-card')).toHaveCount(12)
  await expect(page.getByText('Page 1')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Page 2')).toBeVisible()
  await expect(page.getByTestId('bookmark-card')).toHaveCount(1)

  await page.getByRole('button', { name: 'Prev' }).click()
  await expect(page.getByText('Page 1')).toBeVisible()
  await expect(page.getByTestId('bookmark-card')).toHaveCount(12)
})

test('hides editing actions for a read-only user', async ({ page, request }) => {
  await clearAllBookmarks(request)
  await ensureReadOnlyUser(request)
  await createBookmarks(request, [
    createBookmarkPayload('Read Only Bookmark', ['readonly', 'shared']),
  ])

  await loginByUi(page, readOnlyCredentials.username, readOnlyCredentials.password)

  await expect(bookmarkCard(page, 'Read Only Bookmark')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Bookmark' })).toHaveCount(0)
  await expect(page.getByTitle('Edit')).toHaveCount(0)
  await expect(page.getByTitle('Delete')).toHaveCount(0)
})
