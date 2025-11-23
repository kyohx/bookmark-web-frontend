import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API クライアント - 環境変数', () => {
    let originalViteBackendApiUrl: string | undefined;

    beforeEach(() => {
        // 元の環境変数を保存
        originalViteBackendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
    });

    afterEach(() => {
        // 環境変数を元に戻す（テスト用に型アサーションを使用）
        const env = import.meta.env as Record<string, string | undefined>;
        if (originalViteBackendApiUrl !== undefined) {
            env.VITE_BACKEND_API_URL = originalViteBackendApiUrl;
        } else {
            delete env.VITE_BACKEND_API_URL;
        }
        // モジュールキャッシュをクリアして再読み込み
        vi.resetModules();
    });

    it('環境変数VITE_BACKEND_API_URLが設定されている場合、そのURLを使用する', async () => {
        // 環境変数を設定
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api.example.com');

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api.example.com');
    });

    it('環境変数VITE_BACKEND_API_URLが未設定の場合、空文字列を使用する', async () => {
        // 環境変数を未設定にする
        vi.stubEnv('VITE_BACKEND_API_URL', '');

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('');
    });

    it('環境変数VITE_BACKEND_API_URLが存在しない場合、空文字列を使用する', async () => {
        // 環境変数を削除
        vi.unstubAllEnvs();

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('');
    });

    it('localhost URLが正しく設定される', async () => {
        // 開発環境のURL設定
        vi.stubEnv('VITE_BACKEND_API_URL', 'http://localhost:8000');

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('http://localhost:8000');
    });

    it('ステージング環境のURLが正しく設定される', async () => {
        // ステージング環境のURL設定
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api-staging.example.com');

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api-staging.example.com');
    });

    it('本番環境のURLが正しく設定される', async () => {
        // 本番環境のURL設定
        vi.stubEnv('VITE_BACKEND_API_URL', 'https://api.example.com');

        // モジュールを再インポート
        const { API_BASE } = await import('../src/api/client');

        expect(API_BASE).toBe('https://api.example.com');
    });
});
