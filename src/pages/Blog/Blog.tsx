import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link, useSearchParams } from 'react-router-dom';

import { API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import type { Pagination as PaginationType, Post, PostsResponse } from '../../types';
import { Loader, Pagination } from '../../components';
import { BlogItem } from './components';
import './blog.css';

const fetchPosts = async (
    page: number,
    tagFilter: string,
): Promise<PostsResponse> => {
    const query = new URLSearchParams({
        limit: String(DEFAULT_PAGE_SIZE),
        offset: String((page - 1) * DEFAULT_PAGE_SIZE),
    });

    if (tagFilter) query.set('tags', tagFilter);

    const response = await fetch(`${API_URL}/posts?${query}`);

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }

    return response.json();
};

const Blog = () => {
    const [searchParams] = useSearchParams();
    const tagFilter = searchParams.get('tag')?.trim().replace(/^#/, '') ?? '';

    const [paginationState, setPaginationState] = useState({
        tagFilter,
        page: 1,
    });

    const page = paginationState.tagFilter === tagFilter
        ? paginationState.page
        : 1;

    const {
        data,
        isPending,
        isError,
        error,
        isFetching,
    } = useQuery({
        queryKey: ['posts', page, tagFilter],
        queryFn: () => fetchPosts(page, tagFilter),
    });

    useEffect(() => {
        if (isError) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Could not load blog posts',
            );
        }
    }, [isError, error]);

    const posts: Post[] = data?.data ?? [];
    const pagination: PaginationType | null = data?.pagination ?? null;

    const handlePageChange = (nextPage: number) => {
        setPaginationState({
            tagFilter,
            page: nextPage,
        });
    };

    return (
        <section className="blog-page" data-testid="blog-page">
            <header className="blog-page__heading" data-testid="blog-heading">
                <p className="blog-page__eyebrow">Discover</p>
                <h1>Latest articles</h1>
                <p>Ideas, guides, and stories from our community.</p>
            </header>

            {tagFilter && (
                <p className="blog-tag-search__active" data-testid="blog-tag-filter">
                    Filtered by tag: <strong>{tagFilter}</strong>{' '}
                    <Link to="/blog" data-testid="blog-clear-filter">
                        Clear
                    </Link>
                </p>
            )}

            {isPending ? (
                <div data-testid="blog-loader">
                    <Loader size="large" label="Loading posts" />
                </div>
            ) : posts.length === 0 ? (
                <p data-testid="blog-empty-state">
                    No posts found
                    {tagFilter ? ` with the tag “${tagFilter}”` : ''}.
                </p>
            ) : (
                <>
                    <div className="blog-grid" data-testid="blog-grid">
                        {posts.map((post: Post) => <BlogItem key={post.id} post={post} />)}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div data-testid="blog-pagination">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                hasNextPage={pagination.hasNextPage}
                                hasPreviousPage={pagination.hasPreviousPage}
                                disabled={isFetching}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default Blog;
