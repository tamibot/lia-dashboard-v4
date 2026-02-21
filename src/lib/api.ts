import { API_CONFIG } from '../config/api.config';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private tokenGetter: (() => string | null) | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setTokenGetter(getter: () => string | null) {
        this.tokenGetter = getter;
    }

    private getHeaders(customHeaders: HeadersInit = {}): HeadersInit {
        const token = this.tokenGetter ? this.tokenGetter() : null;
        const headers: HeadersInit = {
            ...API_CONFIG.HEADERS,
            ...customHeaders,
        };

        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        let url = `${this.baseUrl}${endpoint}`;

        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            url += `?${searchParams.toString()}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: this.getHeaders(options.headers),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(data.error || data.message || `API Error: ${response.status}`);
            (error as any).status = response.status;
            (error as any).data = data;
            throw error;
        }

        return data as T;
    }

    get<T>(endpoint: string, params?: Record<string, string>) {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    post<T>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    put<T>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    patch<T>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient(API_CONFIG.BASE_URL);
