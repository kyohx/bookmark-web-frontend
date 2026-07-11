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
});
