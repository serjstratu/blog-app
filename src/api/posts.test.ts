import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, PostsResponse } from '../types';
import { API_URL, DEFAULT_PAGE_SIZE } from '../config';
import { findPostBySlug } from './posts';

const mockFetchResult = vi.fn();

const createPost = (id: number, slug: string): Post => ({
    id,
    title: `Post ${id}`,
    slug,
    content: `Content ${id}`,
    excerpt: null,
    image: null,
    status: 'published',
    categoryId: null,
    tags: [],
    views: 0,
    likes: 0,
    dislikes: 0,
    commentsCount: 0,
    isFeatured: false,
    publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z',
    updatedAt: '2026-11-23T10:00:00Z',
    userId: 1,
});

const createPage = (posts: Post[], totalPages: number): PostsResponse => ({
    data: posts,
    pagination: {
        currentPage: 1,
        perPage: DEFAULT_PAGE_SIZE,
        totalItems: totalPages * DEFAULT_PAGE_SIZE,
        totalPages,
        hasNextPage: totalPages > 1,
        hasPreviousPage: false,
    },
});

describe('findPostBySlug', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn((url: string) => mockFetchResult(url).then((data: unknown) => ({
            ok: true, status: 200, json: () => Promise.resolve(data),
        }))));
    });

    it('returns a matching post from the first page', async () => {
        const post = createPost(91, 'a-new-test-post-to-test-sse');
        mockFetchResult.mockResolvedValueOnce(createPage([post], 3));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockFetchResult).toHaveBeenCalledOnce();
        expect(mockFetchResult).toHaveBeenCalledWith(`${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=0`);
    });

    it('continues pagination and returns a matching post from a later page', async () => {
        const post = createPost(45, 'post-on-page-three');
        mockFetchResult
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 3))
            .mockResolvedValueOnce(createPage([createPost(21, 'second-page-post')], 3))
            .mockResolvedValueOnce(createPage([post], 3));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockFetchResult).toHaveBeenNthCalledWith(1, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=0`);
        expect(mockFetchResult).toHaveBeenNthCalledWith(2, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${DEFAULT_PAGE_SIZE}`);
        expect(mockFetchResult).toHaveBeenNthCalledWith(3, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${DEFAULT_PAGE_SIZE * 2}`);
    });

    it('stops requesting pages once it finds the post', async () => {
        const post = createPost(25, 'second-page-post');
        mockFetchResult
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 4))
            .mockResolvedValueOnce(createPage([post], 4));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockFetchResult).toHaveBeenCalledTimes(2);
    });

    it('throws when the slug is not present in any page', async () => {
        mockFetchResult
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 2))
            .mockResolvedValueOnce(createPage([createPost(21, 'second-page-post')], 2));

        await expect(findPostBySlug('missing-slug')).rejects.toThrow('Post not found');
        expect(mockFetchResult).toHaveBeenCalledTimes(2);
    });

    it('surfaces HTTP errors from the posts endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
        await expect(findPostBySlug('unavailable')).rejects.toThrow('Request failed (503)');
    });
});
