import { afterEach, describe, expect, it, vi } from 'vitest';
import { addFavorite, getFavorites, removeFavorite } from './favorites';

const post = { id: 7, title: 'Saved post', slug: 'saved-post' };
const pagination = { currentPage: 1, perPage: 20, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
const response = (body: unknown, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) }) as unknown as Response;

describe('favorites API', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('loads a favorites page with auth and offset query parameters', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ postIds: [7], data: [post], pagination }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(getFavorites('token', 11, 2, 10)).resolves.toEqual({ postIds: [7], data: [post], pagination });
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/favorites?user_id=11&limit=10&offset=10', {
            headers: { accept: '*/*', Authorization: 'Bearer token' },
        });
    });

    it('derives IDs from post details when the response omits postIds', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ posts: [post], pagination })));
        await expect(getFavorites('token', 11)).resolves.toMatchObject({ postIds: [7], data: [post] });
    });

    it('uses the empty response defaults when posts, IDs, and pagination are absent', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({})));
        await expect(getFavorites('token', 11)).resolves.toEqual({
            postIds: [],
            data: [],
            pagination: { currentPage: 1, perPage: 20, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        });
    });

    it('adds and removes a favorite using the required methods', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({}));
        vi.stubGlobal('fetch', fetchMock);

        await addFavorite('token', 7);
        await removeFavorite('token', 7);
        expect(fetchMock.mock.calls.map(([url, options]) => [url, options?.method])).toEqual([
            ['http://localhost:8000/api/favorites/7', 'POST'],
            ['http://localhost:8000/api/favorites/7', 'DELETE'],
        ]);
    });

    it('surfaces server detail when a favorites request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ detail: 'Published posts only' }, false)));
        await expect(addFavorite('token', 7)).rejects.toThrow('Published posts only');
    });

    it('uses fallback errors when GET or POST error bodies cannot be parsed', async () => {
        const invalidBody = { ok: false, json: vi.fn().mockRejectedValue(new Error('invalid JSON')) };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(invalidBody));

        await expect(getFavorites('token', 11)).rejects.toThrow('Could not load favorites');
        await expect(addFavorite('token', 7)).rejects.toThrow('Could not add post to favorites');
    });

    it('reports DELETE failures and uses its fallback when the error body is invalid', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(response({ detail: 'Favorite not found' }, false))
            .mockResolvedValueOnce({ ok: false, json: vi.fn().mockRejectedValue(new Error('invalid JSON')) });
        vi.stubGlobal('fetch', fetchMock);

        await expect(removeFavorite('token', 7)).rejects.toThrow('Favorite not found');
        await expect(removeFavorite('token', 7)).rejects.toThrow('Could not remove post from favorites');
    });
});
