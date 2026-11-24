
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { Link, useSearchParams } from 'react-router-dom';

import { API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import { getJson } from '../../config/getJson';
import type { Pagination as PaginationType, Post, PostsResponse } from '../../types';
import { Loader, Pagination } from '../../components';
import './blog.css';

const Blog = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [pagination, setPagination] = useState<PaginationType | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const tagFilter = searchParams.get('tag')?.trim().replace(/^#/, '') ?? '';

    useEffect(() => {
        let active = true;
        setLoading(true);
        const offset = (page - 1) * DEFAULT_PAGE_SIZE;
        const query = new URLSearchParams({
            limit: String(DEFAULT_PAGE_SIZE),
            offset: String(offset),
        });

        if (tagFilter) query.set('tags', tagFilter);

        getJson<PostsResponse>(`${API_URL}/posts?${query.toString()}`)
            .then((result) => {
                if (active) {
                    setPosts(result.data);
                    setPagination(result.pagination);
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : 'Could not load blog posts',
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, tagFilter]);

    useEffect(() => {
        setPage(1);
    }, [tagFilter]);

    return (
        <section className="blog-page" data-testid="blog-page">
            <header className="blog-page__heading" data-testid="blog-heading">
                <p className="blog-page__eyebrow">Discover</p>
                <h1>Latest articles</h1>
                <p>Ideas, guides, and stories from our community.</p>
            </header>

            {tagFilter && (
                <p
                    className="blog-tag-search__active"
                    data-testid="blog-tag-filter"
                >
                    Filtered by tag: <strong>{tagFilter}</strong>{' '}
                    <Link to="/blog" data-testid="blog-clear-filter">
                        Clear
                    </Link>
                </p>
            )}

            {loading ? (
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
                        {posts.map((post) => (
                            <article
                                className="blog-card"
                                key={post.id}
                                data-testid="blog-post-card"
                            >
                                {post.image && (
                                    <img
                                        className="blog-card__image"
                                        src={post.image}
                                        alt=""
                                        loading="lazy"
                                        data-testid="blog-post-image"
                                    />
                                )}

                                <div className="blog-card__body">
                                    <div
                                        className="blog-card__meta"
                                        data-testid="blog-post-meta"
                                    >
                                        {post.isFeatured && (
                                            <span
                                                className="blog-card__featured"
                                                data-testid="blog-post-featured"
                                            >
                                                Featured
                                            </span>
                                        )}

                                        <time
                                            dateTime={post.publishedAt ?? post.createdAt}
                                            data-testid="blog-post-date"
                                        >
                                            {dayjs(
                                                post.publishedAt ?? post.createdAt,
                                            ).format('DD.MM.YYYY')}
                                        </time>
                                    </div>

                                    <h2>
                                        <Link
                                            to={`/post/${post.slug}`}
                                            data-testid="blog-post-title"
                                        >
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <p data-testid="blog-post-excerpt">
                                        {post.excerpt || post.content}
                                    </p>

                                    {!!post.tags.length && (
                                        <ul
                                            className="blog-card__tags"
                                            data-testid="blog-post-tags"
                                        >
                                            {post.tags.map((tag) => (
                                                <li key={tag}>
                                                    <Link
                                                        to={`/blog?tag=${encodeURIComponent(tag)}`}
                                                        aria-label={`Search posts tagged ${tag}`}
                                                        data-testid="blog-post-tag"
                                                    >
                                                        {tag}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div
                                        className="blog-card__stats"
                                        data-testid="blog-post-stats"
                                    >
                                        <span>
                                            {post.views.toLocaleString()} views
                                        </span>
                                        <span>{post.likes} likes</span>
                                        <span>{post.commentsCount} comments</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div data-testid="blog-pagination">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                hasNextPage={pagination.hasNextPage}
                                hasPreviousPage={pagination.hasPreviousPage}
                                disabled={loading}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default Blog;
