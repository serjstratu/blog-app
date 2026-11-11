import type {
    LoginRequest,
    LoginResponse,
} from '../types/auth.types';
import { API_URL } from '../../../config/api';

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            throw new Error('Invalid login or password');
        }

        return response.json();
    },
};
