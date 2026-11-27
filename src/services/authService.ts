import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
} from '../types';
import {API_URL} from "../config";
let refreshRequest: Promise<import('../types/auth.types.ts').RefreshResponse> | null = null;

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
            },
            credentials: 'include',
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            throw new Error('Invalid login or password');
        }

        return response.json();
    },

    async register(details: RegisterRequest): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
            },
            credentials: 'include',
            body: JSON.stringify(details),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => null);
            const detail = typeof body?.detail === 'string' ? body.detail : null;
            throw new Error(response.status === 409
                ? detail || 'That username or email is already in use'
                : detail || 'Could not create your account');
        }

        return response.json();
    },

    async refresh() {
        if (!refreshRequest) {
            refreshRequest = fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { accept: '*/*' },
                credentials: 'include',
            }).then(async (response) => {
                if (!response.ok) throw new Error('Session expired. Please log in again.');
                return await response.json() as Promise<import('../types/auth.types.ts').RefreshResponse>;
            }).finally(() => { refreshRequest = null; });
        }
        return refreshRequest;
    },

    async logout(): Promise<void> {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { accept: '*/*' },
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Could not log out from the server');
    },
};
