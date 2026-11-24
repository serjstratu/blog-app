import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Post } from '../../../../types';
import DashPosts from './DashPosts';

const post: Post = {
    id: 95, title: 'Dashboard article', slug: 'dashboard-article', content: 'Content', excerpt: null,
    image: null, status: 'published', categoryId: null, tags: [], views: 10, likes: 2, dislikes: 0,
    commentsCount: 3, isFeatured: false, publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', userId: 11,
};
const pagination = {
    currentPage: 1, perPage: 20, totalItems: 21, totalPages: 2,
    hasNextPage: true, hasPreviousPage: false,
};

const renderDashPosts = (overrides: Partial<React.ComponentProps<typeof DashPosts>> = {}) => {
    const props: React.ComponentProps<typeof DashPosts> = {
        posts: [post], pagination: null, loading: false, deleting: null,
        onPageChange: vi.fn(), onDelete: vi.fn(), onEdit: vi.fn(), ...overrides,
    };
    return { ...render(<MemoryRouter><DashPosts {...props} /></MemoryRouter>), props };
};

describe('DashPosts', () => {
    it('renders post details and links to the post page', () => {
        renderDashPosts();

        expect(screen.getByRole('link', { name: post.title })).toHaveAttribute('href', `/post/${post.slug}`);
        expect(screen.getByText('/dashboard-article')).toBeInTheDocument();
        expect(screen.getByText('published')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('calls onDelete with the selected post id', () => {
        const onDelete = vi.fn();
        renderDashPosts({ onDelete });

        fireEvent.click(screen.getByRole('button', { name: `Remove ${post.title}` }));

        expect(onDelete).toHaveBeenCalledWith(post.id);
    });

    it('calls onEdit with the selected post', () => {
        const onEdit = vi.fn();
        renderDashPosts({ onEdit });

        fireEvent.click(screen.getByRole('button', { name: `Edit ${post.title}` }));

        expect(onEdit).toHaveBeenCalledWith(post);
    });

    it('shows the in-progress delete state and disables the action', () => {
        renderDashPosts({ deleting: `posts-${post.id}` });

        expect(screen.getByRole('button', { name: `Remove ${post.title}` })).toBeDisabled();
        expect(screen.getByRole('button', { name: `Remove ${post.title}` })).toHaveAttribute('aria-busy', 'true');
    });

    it('shows an empty state when there are no posts', () => {
        renderDashPosts({ posts: [] });

        expect(screen.getByText('No posts found.')).toBeInTheDocument();
    });

    it('renders pagination and reports selected pages', () => {
        const onPageChange = vi.fn();
        renderDashPosts({ pagination, onPageChange });

        fireEvent.click(screen.getByTestId('pagination-next'));

        expect(onPageChange).toHaveBeenCalledWith(2);
    });
});
