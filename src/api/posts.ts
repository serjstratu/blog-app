import { API_URL, DEFAULT_PAGE_SIZE } from '../config';
import type { Post, PostsResponse } from '../types';

const fetchPostsPage = async (offset: number): Promise<PostsResponse> => {
    const response = await fetch(`${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`, { headers: { accept: '*/*' } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json() as Promise<PostsResponse>;
};

export const findPostBySlug = async (slug: string): Promise<Post> => {
    const firstPage = await fetchPostsPage(0);
    const firstPageMatch = firstPage.data.find((post) => post.slug === slug);
    if (firstPageMatch) return firstPageMatch;

    const totalPages = firstPage.pagination?.totalPages ?? 1;
    for (let page = 2; page <= totalPages; page += 1) {
        const offset = (page - 1) * DEFAULT_PAGE_SIZE;
        const result = await fetchPostsPage(offset);
        const match = result.data.find((post) => post.slug === slug);
        if (match) return match;
    }

    throw new Error('Post not found');
};
