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
