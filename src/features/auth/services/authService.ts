import type {
    LoginRequest,
    LoginResponse,
} from '../types/auth.types';
import { API_URL } from '../../../config/api';

let refreshRequest: Promise<import('../types/auth.types').RefreshResponse> | null = null;

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

    async refresh() {
        if (!refreshRequest) {
            refreshRequest = fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { accept: '*/*' },
                credentials: 'include',
            }).then(async (response) => {
                if (!response.ok) throw new Error('Session expired. Please log in again.');
                return response.json() as Promise<import('../types/auth.types').RefreshResponse>;
            }).finally(() => { refreshRequest = null; });
        }
        return refreshRequest;
    },
};
