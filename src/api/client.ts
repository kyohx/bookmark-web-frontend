// Get API base URL from environment variable. Uses empty string (Vite proxy) if not set.
export const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

export interface User {
    name: string;
    authority: number;
}

// Authority levels: 0=none, 1=read-only, 2=read-write, 9=admin
export const AUTHORITY = {
    NONE: 0,
    READ_ONLY: 1,
    READ_WRITE: 2,
    ADMIN: 9
} as const;

export function canEdit(authority: number): boolean {
    return authority >= AUTHORITY.READ_WRITE;
}

export interface Bookmark {
    hashed_id: string;
    url: string;
    memo: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface AddBookmarkResponse {
    hashed_id: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export type DeleteBookmarkResponse = Record<string, never>;

const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

class ApiClient {
    private token: string | null = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    private refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    private refreshRequest: Promise<string> | null = null;

    setToken(token: string) {
        this.token = token;
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    }

    private setRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    private setAuthTokens(tokens: Pick<LoginResponse, 'access_token' | 'refresh_token'>) {
        this.setToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
    }

    clearAuthTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }

    getToken() {
        return this.token;
    }

    private redirectToLogin() {
        window.location.href = '/login';
    }

    private async refreshAccessToken(): Promise<string> {
        if (this.refreshRequest) {
            return this.refreshRequest;
        }

        if (!this.refreshToken) {
            throw new Error('Missing refresh token');
        }

        this.refreshRequest = (async () => {
            const response = await fetch(`${API_BASE}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: this.refreshToken }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(error.detail || 'Refresh failed');
            }

            const data: LoginResponse = await response.json();
            this.setAuthTokens(data);
            return data.access_token;
        })();

        try {
            return await this.refreshRequest;
        } finally {
            this.refreshRequest = null;
        }
    }

    async request<T>(endpoint: string, options: RequestInit = {}, retryOnUnauthorized = true): Promise<T> {
        const headers = new Headers(options.headers);

        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }

        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                if (retryOnUnauthorized && endpoint !== '/refresh' && this.refreshToken) {
                    try {
                        await this.refreshAccessToken();
                        return this.request<T>(endpoint, options, false);
                    } catch {
                        this.clearAuthTokens();
                        this.redirectToLogin();
                        throw new Error('Unauthorized');
                    }
                }
                this.clearAuthTokens();
                this.redirectToLogin();
                throw new Error('Unauthorized');
            }
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async login(username: string, password: string): Promise<LoginResponse> {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data: LoginResponse = await response.json();
        this.setAuthTokens(data);
        return data;
    }

    async getMe(): Promise<User> {
        return this.request<User>('/me');
    }

    async getBookmarks(page = 1, size = 10, tag?: string | string[] | null): Promise<{ items: Bookmark[] }> {
        const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
        if (Array.isArray(tag)) {
            for (const value of tag) {
                params.append('tag', value);
            }
        } else if (tag) {
            params.append('tag', tag);
        }
        // API returns { bookmarks: Bookmark[] } and no total count
        const data = await this.request<{ bookmarks: Bookmark[] }>(`/bookmarks?${params.toString()}`);
        return { items: data.bookmarks };
    }

    async getBookmark(hashed_id: string): Promise<Bookmark> {
        const data = await this.request<{ bookmark: Bookmark }>(`/bookmarks/${hashed_id}`);
        return data.bookmark;
    }

    async addBookmark(url: string, memo: string, tags: string[]): Promise<AddBookmarkResponse> {
        return this.request<AddBookmarkResponse>('/bookmarks', {
            method: 'POST',
            body: JSON.stringify({ url, memo, tags }),
        });
    }

    async updateBookmark(hashed_id: string, memo: string, tags: string[]): Promise<Bookmark> {
        // ResponseForUpdateBookmark returns { updated_bookmark: Bookmark }
        // Schema for update does not include url, and tags must be non-empty array or null
        const payload: { memo: string; tags: string[] | null } = { memo, tags: null };
        if (tags && tags.length > 0) {
            payload.tags = tags;
        } else {
            payload.tags = null;
        }

        const data = await this.request<{ updated_bookmark: Bookmark }>(`/bookmarks/${hashed_id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return data.updated_bookmark;
    }

    async deleteBookmark(hashed_id: string): Promise<DeleteBookmarkResponse> {
        return this.request<DeleteBookmarkResponse>(`/bookmarks/${hashed_id}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();
