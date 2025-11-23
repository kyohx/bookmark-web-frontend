// 環境変数からAPI URLを取得。未設定の場合は空文字列（Viteプロキシ使用）
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
    memo?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

class ApiClient {
    private token: string | null = localStorage.getItem('access_token');

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    getToken() {
        return this.token;
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
                this.clearToken();
                window.location.href = '/login';
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

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    }

    async getMe(): Promise<User> {
        return this.request<User>('/me');
    }

    async getBookmarks(page = 1, size = 10, tag?: string): Promise<{ items: Bookmark[] }> {
        const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
        if (tag) params.append('tag', tag);
        // API returns { bookmarks: Bookmark[] } and no total count
        const data = await this.request<{ bookmarks: Bookmark[] }>(`/bookmarks?${params.toString()}`);
        return { items: data.bookmarks };
    }

    async getBookmark(hashed_id: string): Promise<Bookmark> {
        const data = await this.request<{ bookmark: Bookmark }>(`/bookmarks/${hashed_id}`);
        return data.bookmark;
    }

    async addBookmark(url: string, memo: string, tags: string[]): Promise<Bookmark> {
        return this.request<Bookmark>('/bookmarks', {
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

    async deleteBookmark(hashed_id: string): Promise<void> {
        return this.request<void>(`/bookmarks/${hashed_id}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();
