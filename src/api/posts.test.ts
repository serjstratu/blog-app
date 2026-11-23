import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, PostsResponse } from '../types';
import { API_URL, DEFAULT_PAGE_SIZE } from '../config';
import { getJson } from '../config/getJson';
import { findPostBySlug } from './posts';

vi.mock('../config/getJson', () => ({
    getJson: vi.fn(),
}));

const mockGetJson = vi.mocked(getJson);

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
    });

    it('returns a matching post from the first page', async () => {
        const post = createPost(91, 'a-new-test-post-to-test-sse');
        mockGetJson.mockResolvedValueOnce(createPage([post], 3));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockGetJson).toHaveBeenCalledOnce();
        expect(mockGetJson).toHaveBeenCalledWith(`${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=0`);
    });

    it('continues pagination and returns a matching post from a later page', async () => {
        const post = createPost(45, 'post-on-page-three');
        mockGetJson
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 3))
            .mockResolvedValueOnce(createPage([createPost(21, 'second-page-post')], 3))
            .mockResolvedValueOnce(createPage([post], 3));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockGetJson).toHaveBeenNthCalledWith(1, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=0`);
        expect(mockGetJson).toHaveBeenNthCalledWith(2, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${DEFAULT_PAGE_SIZE}`);
        expect(mockGetJson).toHaveBeenNthCalledWith(3, `${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${DEFAULT_PAGE_SIZE * 2}`);
    });

    it('stops requesting pages once it finds the post', async () => {
        const post = createPost(25, 'second-page-post');
        mockGetJson
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 4))
            .mockResolvedValueOnce(createPage([post], 4));

        await expect(findPostBySlug(post.slug)).resolves.toEqual(post);

        expect(mockGetJson).toHaveBeenCalledTimes(2);
    });

    it('throws when the slug is not present in any page', async () => {
        mockGetJson
            .mockResolvedValueOnce(createPage([createPost(1, 'first-page-post')], 2))
            .mockResolvedValueOnce(createPage([createPost(21, 'second-page-post')], 2));

        await expect(findPostBySlug('missing-slug')).rejects.toThrow('Post not found');
        expect(mockGetJson).toHaveBeenCalledTimes(2);
    });
});
