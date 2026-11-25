import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Blog from './Blog';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';
import type { PostsResponse } from '../../types';

const { mockFetchResult, mockToastError } = vi.hoisted(() => ({
    mockFetchResult: vi.fn(),
    mockToastError: vi.fn(),
}));

vi.mock('../../config', () => ({
    API_URL: 'http://localhost:8000/api',
    DEFAULT_PAGE_SIZE: 10,
}));

vi.mock('react-toastify', () => ({
    toast: {
        error: mockToastError,
    },
}));

vi.mock('../../components', async () => {
    const React = await import('react');

    return {
        Loader: ({ label, size }: { label: string; size?: string }) =>
            React.createElement(
                'div',
                {
                    'data-testid': 'loader',
                    'data-size': size,
                },
                label,
            ),

        Pagination: ({
                         currentPage,
                         totalPages,
                         disabled,
                         onPageChange,
                     }: {
            currentPage: number;
            totalPages: number;
            disabled: boolean;
            onPageChange: (page: number) => void;
        }) =>
            React.createElement(
                'nav',
                { 'data-testid': 'pagination' },
                React.createElement(
                    'span',
                    null,
                    `Page ${currentPage} of ${totalPages}`,
                ),
                React.createElement(
                    'button',
                    {
                        type: 'button',
                        disabled,
                        onClick: () => onPageChange(currentPage + 1),
                    },
                    'Next',
                ),
            ),
    };
});

const mockPost = {
    id: 1,
    slug: 'react-testing',
    title: 'React Testing Guide',
    excerpt: 'Learn how to test React applications.',
    content: 'Full article content.',
    image: 'https://example.com/react.jpg',
    tags: ['React', 'Testing'],
    isFeatured: true,
    publishedAt: '2026-11-20T10:00:00.000Z',
    createdAt: '2026-11-19T10:00:00.000Z',
    views: 1250,
    likes: 42,
    dislikes: 100,
    commentsCount: 8,
    status: 'published',
    categoryId: 1,
    updatedAt: '2026-11-20T10:00:00.000Z',
    userId: 1,
};

const mockPagination = {
    currentPage: 1,
    perPage: 10,
    totalItems: 15,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
};

const mockResponse: PostsResponse = {
    data: [mockPost],
    pagination: mockPagination,
};

const renderBlog = (initialEntry = '/blog') => {
    return renderWithQueryClient(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Blog />
        </MemoryRouter>,
    );
};

describe('Blog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchResult.mockResolvedValue(mockResponse);
        vi.stubGlobal('fetch', vi.fn((url: string) => mockFetchResult(url).then((data: unknown) => ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
        }))));
    });

    it('should render the blog page heading', () => {
        renderBlog();

        expect(screen.getByTestId('blog-page')).toBeInTheDocument();
        expect(screen.getByTestId('blog-heading')).toBeInTheDocument();

        expect(
            screen.getByRole('heading', { name: 'Latest articles' }),
        ).toBeInTheDocument();
    });

    it('should display loader while posts are loading', () => {
        mockFetchResult.mockReturnValue(new Promise(() => {}));

        renderBlog();

        expect(screen.getByTestId('blog-loader')).toBeInTheDocument();
        expect(screen.getByTestId('loader')).toHaveTextContent(
            'Loading posts',
        );
        expect(screen.getByTestId('loader')).toHaveAttribute(
            'data-size',
            'large',
        );
    });

    it('should fetch posts from API with default pagination parameters', async () => {
        renderBlog();

        await waitFor(() => {
            expect(mockFetchResult).toHaveBeenCalledWith(
                'http://localhost:8000/api/posts?limit=10&offset=0',
            );
        });
    });

    it('should render posts after successful API response', async () => {
        renderBlog();

        expect(
            await screen.findByTestId('blog-post-card'),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('heading', { name: 'React Testing Guide' }),
        ).toBeInTheDocument();

        expect(
            screen.getByTestId('blog-post-excerpt'),
        ).toHaveTextContent('Learn how to test React applications.');

        expect(screen.queryByTestId('blog-loader')).not.toBeInTheDocument();
    });

    it('should render post image, featured badge and publication date', async () => {
        renderBlog();

        const image = await screen.findByTestId('blog-post-image');

        expect(image).toHaveAttribute(
            'src',
            'https://example.com/react.jpg',
        );

        expect(image).toHaveAttribute('loading', 'lazy');
        expect(image).toHaveAttribute('alt', '');

        expect(
            screen.getByTestId('blog-post-featured'),
        ).toHaveTextContent('Featured');

        expect(screen.getByTestId('blog-post-date')).toHaveTextContent(
            '20.11.2026',
        );
    });

    it('should render post tags with correct links', async () => {
        renderBlog();

        const tags = await screen.findAllByTestId('blog-post-tag');

        expect(tags).toHaveLength(2);

        expect(tags[0]).toHaveTextContent('React');
        expect(tags[0]).toHaveAttribute(
            'href',
            '/blog?tag=React',
        );

        expect(tags[1]).toHaveTextContent('Testing');
        expect(tags[1]).toHaveAttribute(
            'href',
            '/blog?tag=Testing',
        );
    });

    it('should render post statistics', async () => {
        renderBlog();

        const stats = await screen.findByTestId('blog-post-stats');

        expect(stats).toHaveTextContent('1,250 views');
        expect(stats).toHaveTextContent('42 likes');
        expect(stats).toHaveTextContent('8 comments');
    });

    it('should render post title link with correct URL', async () => {
        renderBlog();

        const title = await screen.findByTestId('blog-post-title');

        expect(title).toHaveAttribute('href', '/post/react-testing');
    });

    it('should fetch posts filtered by tag', async () => {
        renderBlog('/blog?tag=React');

        expect(
            await screen.findByTestId('blog-tag-filter'),
        ).toHaveTextContent('React');

        await waitFor(() => {
            expect(mockFetchResult).toHaveBeenCalledWith(
                'http://localhost:8000/api/posts?limit=10&offset=0&tags=React',
            );
        });
    });

    it('should remove leading hash from tag filter', async () => {
        renderBlog('/blog?tag=%23React');

        expect(
            await screen.findByTestId('blog-tag-filter'),
        ).toHaveTextContent('React');

        await waitFor(() => {
            expect(mockFetchResult).toHaveBeenCalledWith(
                'http://localhost:8000/api/posts?limit=10&offset=0&tags=React',
            );
        });
    });

    it('should render empty state when no posts are found', async () => {
        mockFetchResult.mockResolvedValue({
            data: [],
            pagination: {
                ...mockPagination,
                totalPages: 0,
            },
        });

        renderBlog();

        expect(
            await screen.findByTestId('blog-empty-state'),
        ).toHaveTextContent('No posts found.');

        expect(screen.queryByTestId('blog-grid')).not.toBeInTheDocument();
    });

    it('should include tag name in empty state when filtering', async () => {
        mockFetchResult.mockResolvedValue({
            data: [],
            pagination: {
                ...mockPagination,
                totalPages: 0,
            },
        });

        renderBlog('/blog?tag=React');

        expect(
            await screen.findByTestId('blog-empty-state'),
        ).toHaveTextContent('No posts found with the tag “React”.');
    });

    it('should display error toast when API request fails', async () => {
        mockFetchResult.mockRejectedValue(new Error('Network error'));

        renderBlog();

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith('Network error');
        });

        expect(screen.queryByTestId('blog-loader')).not.toBeInTheDocument();
    });

    it('should display fallback error message for unknown errors', async () => {
        mockFetchResult.mockRejectedValue('Unknown error');

        renderBlog();

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith(
                'Could not load blog posts',
            );
        });
    });

    it('should render pagination when there are multiple pages', async () => {
        renderBlog();

        expect(
            await screen.findByTestId('blog-pagination'),
        ).toBeInTheDocument();

        expect(screen.getByTestId('pagination')).toHaveTextContent(
            'Page 1 of 2',
        );
    });

    it('should not render pagination when there is only one page', async () => {
        mockFetchResult.mockResolvedValue({
            data: [mockPost],
            pagination: {
                ...mockPagination,
                totalPages: 1,
            },
        });

        renderBlog();

        await screen.findByTestId('blog-post-card');

        expect(
            screen.queryByTestId('blog-pagination'),
        ).not.toBeInTheDocument();
    });

    it('should fetch next page when pagination changes', async () => {
        renderBlog();

        await screen.findByTestId('blog-post-card');

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        await waitFor(() => {
            expect(mockFetchResult).toHaveBeenLastCalledWith(
                'http://localhost:8000/api/posts?limit=10&offset=10',
            );
        });
    });

    it('should not render post image when image is missing', async () => {
        mockFetchResult.mockResolvedValue({
            data: [{ ...mockPost, image: '' }],
            pagination: {
                ...mockPagination,
                totalPages: 1,
            },
        });

        renderBlog();

        await screen.findByTestId('blog-post-card');

        expect(
            screen.queryByTestId('blog-post-image'),
        ).not.toBeInTheDocument();
    });

    it('should render post content when excerpt is missing', async () => {
        mockFetchResult.mockResolvedValue({
            data: [{ ...mockPost, excerpt: '' }],
            pagination: {
                ...mockPagination,
                totalPages: 1,
            },
        });

        renderBlog();

        expect(
            await screen.findByTestId('blog-post-excerpt'),
        ).toHaveTextContent('Full article content.');
    });

    it('should not render tags when post has no tags', async () => {
        mockFetchResult.mockResolvedValue({
            data: [{ ...mockPost, tags: [] }],
            pagination: {
                ...mockPagination,
                totalPages: 1,
            },
        });

        renderBlog();

        await screen.findByTestId('blog-post-card');

        expect(
            screen.queryByTestId('blog-post-tags'),
        ).not.toBeInTheDocument();
    });

    it('should not render featured badge for non-featured posts', async () => {
        mockFetchResult.mockResolvedValue({
            data: [{ ...mockPost, isFeatured: false }],
            pagination: {
                ...mockPagination,
                totalPages: 1,
            },
        });

        renderBlog();

        await screen.findByTestId('blog-post-card');

        expect(
            screen.queryByTestId('blog-post-featured'),
        ).not.toBeInTheDocument();
    });
});
