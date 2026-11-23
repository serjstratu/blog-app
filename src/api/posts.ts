import { API_URL, DEFAULT_PAGE_SIZE } from '../config';
import { getJson } from '../config/getJson';
import type { Post, PostsResponse } from '../types';

export const findPostBySlug = async (slug: string): Promise<Post> => {
    const firstPage = await getJson<PostsResponse>(
        `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=0`,
    );
    const firstPageMatch = firstPage.data.find((post) => post.slug === slug);
    if (firstPageMatch) return firstPageMatch;

    const totalPages = firstPage.pagination?.totalPages ?? 1;
    for (let page = 2; page <= totalPages; page += 1) {
        const offset = (page - 1) * DEFAULT_PAGE_SIZE;
        const result = await getJson<PostsResponse>(
            `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`,
        );
        const match = result.data.find((post) => post.slug === slug);
        if (match) return match;
    }

    throw new Error('Post not found');
};
