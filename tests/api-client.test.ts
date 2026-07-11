import { describe, it, expect, vi, afterEach } from 'vitest';

describe('API Client - Environment Variables', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });


    it('uses the URL when VITE_BACKEND_API_URL is set', async () => {
        // Set environment variable
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api.example.com');

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api.example.com');
    });

    it('uses empty string when VITE_BACKEND_API_URL is unset', async () => {
        // Set environment variable to empty string
        vi.stubEnv('VITE_BACKEND_API_URL', '');

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('');
    });

    it('uses empty string when VITE_BACKEND_API_URL does not exist', async () => {
        // Remove environment variable
        vi.unstubAllEnvs();

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('');
    });

    it('correctly sets localhost URL', async () => {
        // Set development environment URL
        vi.stubEnv('VITE_BACKEND_API_URL', 'http://localhost:8000');

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('http://localhost:8000');
    });

    it('correctly sets staging environment URL', async () => {
        // Set staging environment URL
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api-staging.example.com');

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api-staging.example.com');
    });

    it('correctly sets production environment URL', async () => {
        // Set production environment URL
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api.example.com');

        // Re-import module
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api.example.com');
    });
});

describe('API Client - OpenAPI alignment', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.resetModules();
        localStorage.clear();
    });

    it('returns the full login payload including refresh_token', async () => {
        const payload = {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            token_type: 'bearer',
        };

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });
        vi.stubGlobal('fetch', fetchMock);

        const { api } = await import('../src/api/client');
        const result = await api.login('alice', 'secret');

        expect(result).toEqual(payload);
        expect(localStorage.getItem('access_token')).toBe('access-token');
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
        expect(fetchMock).toHaveBeenCalledWith('/token', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: expect.any(URLSearchParams),
        }));

        const [, options] = fetchMock.mock.calls[0];
        const body = options.body as URLSearchParams;
        expect(body.get('username')).toBe('alice');
        expect(body.get('password')).toBe('secret');
    });

    it('serializes multiple tag filters as repeated query parameters', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ bookmarks: [] }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { api } = await import('../src/api/client');
        await api.getBookmarks(2, 20, ['frontend', 'react']);

        expect(fetchMock).toHaveBeenCalledWith(
            '/bookmarks?page=2&size=20&tag=frontend&tag=react',
            expect.any(Object),
        );
    });

    it('returns the delete response object', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { api } = await import('../src/api/client');

        await expect(api.deleteBookmark('hash')).resolves.toEqual({});
        expect(fetchMock).toHaveBeenCalledWith(
            '/bookmarks/hash',
            expect.objectContaining({ method: 'DELETE' }),
        );
    });

    it('refreshes tokens and retries the original request after a 401', async () => {
        localStorage.setItem('access_token', 'expired-access-token');
        localStorage.setItem('refresh_token', 'refresh-token');

        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Expired access token' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'bearer',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ name: 'alice', authority: 2 }),
            });
        vi.stubGlobal('fetch', fetchMock);

        const { api } = await import('../src/api/client');
        const redirectSpy = vi.spyOn(
            api as unknown as { redirectToLogin: () => void },
            'redirectToLogin',
        ).mockImplementation(() => undefined);

        await expect(api.getMe()).resolves.toEqual({ name: 'alice', authority: 2 });

        expect(redirectSpy).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0][0]).toBe('/me');
        expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer expired-access-token');
        expect(fetchMock.mock.calls[1][0]).toBe('/refresh');
        expect(fetchMock.mock.calls[1][1]).toMatchObject({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ refresh_token: 'refresh-token' }));
        expect(fetchMock.mock.calls[2][0]).toBe('/me');
        expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer new-access-token');
        expect(localStorage.getItem('access_token')).toBe('new-access-token');
        expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    });

    it('clears auth state when refresh fails after a 401', async () => {
        localStorage.setItem('access_token', 'expired-access-token');
        localStorage.setItem('refresh_token', 'expired-refresh-token');

        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Expired access token' }),
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Expired refresh token' }),
            });
        vi.stubGlobal('fetch', fetchMock);

        const { api } = await import('../src/api/client');
        const redirectSpy = vi.spyOn(
            api as unknown as { redirectToLogin: () => void },
            'redirectToLogin',
        ).mockImplementation(() => undefined);

        await expect(api.getMe()).rejects.toThrow('Unauthorized');

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(redirectSpy).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });
});
