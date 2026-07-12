import type { APIRequestContext, APIResponse } from '@playwright/test'

export const adminCredentials = {
  username: 'testuser',
  password: 'n3#7%$tB5T',
} as const

export const readOnlyCredentials = {
  username: 'readonly_e2e',
  password: 'Readonly#123',
} as const

export const authority = {
  readOnly: 1,
} as const

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:8000'
const API_RETRY_DELAY_MS = 150
const API_MAX_ATTEMPTS = 3

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

interface BookmarkPayload {
  url: string
  memo: string
  tags: string[]
}

interface Bookmark {
  hashed_id: string
}

interface BookmarkListResponse {
  bookmarks: Bookmark[]
}

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

async function ensureOk(response: APIResponse, action: string): Promise<void> {
  if (response.ok()) {
    return
  }

  throw new Error(`${action} failed with ${response.status()}: ${await response.text()}`)
}

async function withRetries<T>(action: string, task: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < API_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (attempt < API_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY_MS))
      }
    }
  }

  throw new Error(`${action} failed after ${API_MAX_ATTEMPTS} attempts: ${String(lastError)}`)
}

export async function loginByApi(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<LoginResponse> {
  return withRetries(`Login for ${username}`, async () => {
    const response = await request.post(apiUrl('/token'), {
      form: { username, password },
    })

    await ensureOk(response, `Login for ${username}`)
    return response.json() as Promise<LoginResponse>
  })
}

export async function clearAllBookmarks(request: APIRequestContext): Promise<void> {
  const { access_token } = await loginByApi(request, adminCredentials.username, adminCredentials.password)

  while (true) {
    const listResponse = await withRetries('List bookmarks for cleanup', () =>
      request.get(apiUrl('/bookmarks?page=1&size=100'), {
        headers: authHeaders(access_token),
      }),
    )
    await ensureOk(listResponse, 'List bookmarks for cleanup')

    const { bookmarks } = (await listResponse.json()) as BookmarkListResponse
    if (bookmarks.length === 0) {
      return
    }

    for (const bookmark of bookmarks) {
      const deleteResponse = await withRetries(`Delete bookmark ${bookmark.hashed_id}`, () =>
        request.delete(apiUrl(`/bookmarks/${bookmark.hashed_id}`), {
          headers: authHeaders(access_token),
        }),
      )
      await ensureOk(deleteResponse, `Delete bookmark ${bookmark.hashed_id}`)
      await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY_MS))
    }
  }
}

export async function createBookmarks(
  request: APIRequestContext,
  bookmarks: BookmarkPayload[],
): Promise<void> {
  const { access_token } = await loginByApi(request, adminCredentials.username, adminCredentials.password)

  for (const bookmark of bookmarks) {
    const response = await withRetries(`Create bookmark ${bookmark.memo}`, () =>
      request.post(apiUrl('/bookmarks'), {
        headers: {
          ...authHeaders(access_token),
          'Content-Type': 'application/json',
        },
        data: bookmark,
      }),
    )
    await ensureOk(response, `Create bookmark ${bookmark.memo}`)
    await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY_MS))
  }
}

export async function ensureReadOnlyUser(request: APIRequestContext): Promise<void> {
  const { access_token } = await loginByApi(request, adminCredentials.username, adminCredentials.password)
  const headers = {
    ...authHeaders(access_token),
    'Content-Type': 'application/json',
  }

  const getResponse = await withRetries(`Fetch user ${readOnlyCredentials.username}`, () =>
    request.get(apiUrl(`/users/${readOnlyCredentials.username}`), {
      headers: authHeaders(access_token),
    }),
  )

  if (getResponse.status() === 404) {
    const createResponse = await withRetries(`Create user ${readOnlyCredentials.username}`, () =>
      request.post(apiUrl('/users'), {
        headers,
        data: {
          name: readOnlyCredentials.username,
          password: readOnlyCredentials.password,
          authority: authority.readOnly,
        },
      }),
    )
    await ensureOk(createResponse, `Create user ${readOnlyCredentials.username}`)
    return
  }

  await ensureOk(getResponse, `Fetch user ${readOnlyCredentials.username}`)

  const updateResponse = await withRetries(`Update user ${readOnlyCredentials.username}`, () =>
    request.patch(apiUrl(`/users/${readOnlyCredentials.username}`), {
      headers,
      data: {
        password: readOnlyCredentials.password,
        authority: authority.readOnly,
        disabled: false,
      },
    })
  )
  await ensureOk(updateResponse, `Update user ${readOnlyCredentials.username}`)
}
