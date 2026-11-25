import { API_URL } from '../config';
import { DEFAULT_PAGE_SIZE } from '../config';
import type { Pagination, Post } from '../types';

export interface FavoritesResponse {
    postIds: number[];
    data: Post[];
    pagination: Pagination;
}

const emptyPagination: Pagination = {
    currentPage: 1,
    perPage: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

export async function getFavorites(
    accessToken: string,
    userId: number,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
): Promise<FavoritesResponse> {
    const offset = (page - 1) * limit;
    const response = await fetch(`${API_URL}/favorites?user_id=${userId}&limit=${limit}&offset=${offset}`, {
        headers: { accept: '*/*', Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'Could not load favorites');
    }

    const result = await response.json();
    const data = Array.isArray(result.data) ? result.data : Array.isArray(result.posts) ? result.posts : [];
    const postIds = Array.isArray(result.postIds)
        ? result.postIds
        : data.map((post: Post) => post.id);
    return { postIds, data, pagination: result.pagination ?? emptyPagination };
}

export async function addFavorite(accessToken: string, postId: number): Promise<void> {
    const response = await fetch(`${API_URL}/favorites/${postId}`, {
        method: 'POST',
        headers: { accept: '*/*', Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'Could not add post to favorites');
    }
}

export async function removeFavorite(accessToken: string, postId: number): Promise<void> {
    const response = await fetch(`${API_URL}/favorites/${postId}`, {
        method: 'DELETE',
        headers: { accept: '*/*', Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'Could not remove post from favorites');
    }
}
