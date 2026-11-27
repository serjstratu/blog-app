import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from './authService';

vi.mock('../config', () => ({
    API_URL: 'http://localhost:8000/api',
}));

const API_URL = 'http://localhost:8000/api';

const mockFetch = vi.fn();

const createResponse = (
    data: unknown = {},
    ok = true,
): Response =>
    ({
        ok,
        json: vi.fn().mockResolvedValue(data),
    }) as unknown as Response;

describe('authService', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('login', () => {
        const credentials = {
            login: 'test@example.com',
            password: 'Password123!',
        };

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
        };

        it('should login successfully', async () => {
            mockFetch.mockResolvedValue(createResponse(mockUser));

            const result = await authService.login(credentials);

            expect(result).toEqual(mockUser);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should send correct request configuration', async () => {
            mockFetch.mockResolvedValue(createResponse(mockUser));

            await authService.login(credentials);

            expect(mockFetch).toHaveBeenCalledWith(
                `${API_URL}/auth/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: '*/*',
                    },
                    credentials: 'include',
                    body: JSON.stringify(credentials),
                },
            );
        });

        it('should throw an error when login fails', async () => {
            mockFetch.mockResolvedValue(createResponse({}, false));

            await expect(authService.login(credentials))
                .rejects.toThrow('Invalid login or password');
        });
    });

    describe('register', () => {
        const details = { name: 'Alex Johnson', username: 'alexj', email: 'alex@example.com', password: 'password123' };
        const responseBody = { access_token: 'access', token_type: 'bearer', expires_in: 3600, user: { id: 11 } };

        it('posts registration details with cookies enabled and returns the session response', async () => {
            mockFetch.mockResolvedValue(createResponse(responseBody));

            await expect(authService.register(details)).resolves.toEqual(responseBody);
            expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', accept: '*/*' },
                credentials: 'include',
                body: JSON.stringify(details),
            });
        });

        it('uses the conflict detail when username or email is already taken', async () => {
            const conflict = { ...createResponse({ detail: 'Username already exists' }, false), status: 409 } as Response;
            mockFetch.mockResolvedValue(conflict);

            await expect(authService.register(details)).rejects.toThrow('Username already exists');
        });

        it('uses a helpful conflict fallback when the response has no detail', async () => {
            const conflict = { ...createResponse({}, false), status: 409 } as Response;
            mockFetch.mockResolvedValue(conflict);

            await expect(authService.register(details)).rejects.toThrow('That username or email is already in use');
        });

        it('reports non-conflict registration failures', async () => {
            mockFetch.mockResolvedValue(createResponse({}, false));

            await expect(authService.register(details)).rejects.toThrow('Could not create your account');
        });
    });

    describe('refresh', () => {
        const mockRefreshResponse = {
            access_token: 'new-access-token',
            token_type: 'bearer',
        };

        it('should refresh the access token successfully', async () => {
            mockFetch.mockResolvedValue(
                createResponse(mockRefreshResponse),
            );

            const result = await authService.refresh();

            expect(result).toEqual(mockRefreshResponse);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                `${API_URL}/auth/refresh`,
                {
                    method: 'POST',
                    headers: {
                        accept: '*/*',
                    },
                    credentials: 'include',
                },
            );
        });

        it('should throw an error when refresh fails', async () => {
            mockFetch.mockResolvedValue(createResponse({}, false));

            await expect(authService.refresh())
                .rejects.toThrow(
                    'Session expired. Please log in again.',
                );
        });

        it('should allow a new refresh request after a failed request', async () => {
            mockFetch
                .mockResolvedValueOnce(createResponse({}, false))
                .mockResolvedValueOnce(
                    createResponse(mockRefreshResponse),
                );

            await expect(authService.refresh())
                .rejects.toThrow(
                    'Session expired. Please log in again.',
                );

            const result = await authService.refresh();

            expect(result).toEqual(mockRefreshResponse);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should reuse the same request for concurrent refresh calls', async () => {
            let resolveRequest!: (response: Response) => void;

            const pendingResponse = new Promise<Response>((resolve) => {
                resolveRequest = resolve;
            });

            mockFetch.mockReturnValue(pendingResponse);

            const firstRequest = authService.refresh();
            const secondRequest = authService.refresh();
            const thirdRequest = authService.refresh();

            expect(mockFetch).toHaveBeenCalledTimes(1);

            resolveRequest(createResponse(mockRefreshResponse));

            const results = await Promise.all([
                firstRequest,
                secondRequest,
                thirdRequest,
            ]);

            expect(results).toEqual([
                mockRefreshResponse,
                mockRefreshResponse,
                mockRefreshResponse,
            ]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should allow a new refresh request after a successful request', async () => {
            mockFetch.mockResolvedValue(
                createResponse(mockRefreshResponse),
            );

            await authService.refresh();
            await authService.refresh();

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            mockFetch.mockResolvedValue(createResponse());

            await expect(authService.logout()).resolves.toBeUndefined();

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should send correct request configuration', async () => {
            mockFetch.mockResolvedValue(createResponse());

            await authService.logout();

            expect(mockFetch).toHaveBeenCalledWith(
                `${API_URL}/auth/logout`,
                {
                    method: 'POST',
                    headers: {
                        accept: '*/*',
                    },
                    credentials: 'include',
                },
            );
        });

        it('should throw an error when logout fails', async () => {
            mockFetch.mockResolvedValue(createResponse({}, false));

            await expect(authService.logout())
                .rejects.toThrow(
                    'Could not log out from the server',
                );
        });
    });
});
