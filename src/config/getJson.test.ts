import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson } from './getJson';

const mockFetch = vi.fn();
const jsonResponse = (data: unknown, ok = true, status = 200) => ({
    ok, status, json: vi.fn().mockResolvedValue(data),
}) as unknown as Response;

describe('getJson', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches JSON using the default accept header', async () => {
        const payload = { data: ['one'] };
        mockFetch.mockResolvedValue(jsonResponse(payload));

        await expect(getJson<typeof payload>('https://api.example.test/posts')).resolves.toEqual(payload);

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.test/posts', {
            headers: { accept: '*/*' },
        });
    });

    it('passes custom headers to fetch', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
        const headers = { accept: 'application/json', Authorization: 'Bearer token' };

        await getJson('https://api.example.test/private', headers);

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.test/private', { headers });
    });

    it('shares an in-flight request for the same URL', async () => {
        let resolveFetch!: (response: Response) => void;
        mockFetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

        const firstRequest = getJson<{ value: number }>('https://api.example.test/shared');
        const secondRequest = getJson<{ value: number }>('https://api.example.test/shared');

        expect(secondRequest).toBe(firstRequest);
        expect(mockFetch).toHaveBeenCalledOnce();

        resolveFetch(jsonResponse({ value: 7 }));
        await expect(firstRequest).resolves.toEqual({ value: 7 });
    });

    it('removes a successful request from the in-flight cache after completion', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ value: 1 }));
        const url = 'https://api.example.test/after-success';

        await getJson(url);
        await getJson(url);

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('rejects non-success HTTP responses and clears the failed request from cache', async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ detail: 'not found' }, false, 404))
            .mockResolvedValueOnce(jsonResponse({ recovered: true }));
        const url = 'https://api.example.test/retry-after-error';

        await expect(getJson(url)).rejects.toThrow('Request failed (404)');
        await expect(getJson(url)).resolves.toEqual({ recovered: true });

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('passes JSON parsing errors to the caller and clears the rejected request', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: vi.fn().mockRejectedValue(new Error('Invalid JSON')) })
            .mockResolvedValueOnce(jsonResponse({ recovered: true }));
        const url = 'https://api.example.test/invalid-json';

        await expect(getJson(url)).rejects.toThrow('Invalid JSON');
        await expect(getJson(url)).resolves.toEqual({ recovered: true });

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
