import { api } from '../api';
import { API_CONFIG } from '../../config/api.config';

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        orgId: string;
        orgName: string;
    };
}

export const authService = {
    async login(credentials: any): Promise<AuthResponse> {
        const data = await api.post<AuthResponse>('/auth/login', credentials);
        localStorage.setItem(API_CONFIG.TOKEN_KEY, data.token);
        this.setUser(data.user);
        return data;
    },

    async register(data: any): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        localStorage.setItem(API_CONFIG.TOKEN_KEY, response.token);
        this.setUser(response.user);
        return response;
    },

    logout(): void {
        localStorage.removeItem(API_CONFIG.TOKEN_KEY);
        this.clearUser();
    },

    getToken(): string | null {
        return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    setUser(user: any): void {
        localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
    },

    getUser(): any | null {
        const storedUser = localStorage.getItem(API_CONFIG.USER_KEY);
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error("Failed to parse stored user", e);
            return null;
        }
    },

    clearUser(): void {
        localStorage.removeItem(API_CONFIG.USER_KEY);
    }
};

api.setTokenGetter(() => authService.getToken());

