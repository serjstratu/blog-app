import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Comment, Post } from '../../../../types';
import DashComments from './DashComments';

const post: Post = {
    id: 95, title: 'Dashboard article', slug: 'dashboard-article', content: 'Content', excerpt: null,
    image: null, status: 'published', categoryId: null, tags: [], views: 10, likes: 2, dislikes: 0,
    commentsCount: 1, isFeatured: false, publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', userId: 11,
};
const comment: Comment = {
    id: 12, postId: 95, authorId: 4, parentId: null, content: 'Useful comment',
    createdAt: '2026-11-23T10:30:00Z', updatedAt: '2026-11-23T10:30:00Z', replies: [],
    author: { id: 4, name: 'Taylor Reader' },
};
const pagination = {
    currentPage: 1, perPage: 20, totalItems: 21, totalPages: 2,
    hasNextPage: true, hasPreviousPage: false,
};

const renderDashComments = (overrides: Partial<React.ComponentProps<typeof DashComments>> = {}) => {
    const props: React.ComponentProps<typeof DashComments> = {
        posts: [post], comments: [comment], selectedPostId: post.id,
        postPagination: null, commentPagination: null, loading: false, deleting: null,
        onSelectPost: vi.fn(), onPostPageChange: vi.fn(), onCommentPageChange: vi.fn(), onDelete: vi.fn(),
        ...overrides,
    };
    return { ...render(<MemoryRouter><DashComments {...props} /></MemoryRouter>), props };
};

describe('DashComments', () => {
    it('renders comment author, content, date, and a link to its post anchor', () => {
        renderDashComments();

        expect(screen.getByText(comment.content)).toBeInTheDocument();
        expect(screen.getByText('Taylor Reader')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: `Post ${post.id}` })).toHaveAttribute('href', `/post/${post.id}#comment-${comment.id}`);
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls onSelectPost when another post is selected', () => {
        const onSelectPost = vi.fn();
        const anotherPost = { ...post, id: 96, title: 'Another article' };
        renderDashComments({ posts: [post, anotherPost], onSelectPost });

        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: '96' } });

        expect(onSelectPost).toHaveBeenCalledWith(96);
    });

    it('shows a prompt and does not render the comments table without a selected post', () => {
        renderDashComments({ selectedPostId: null, comments: [] });

        expect(screen.getByText('Select a post to view its comments.')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows an empty state for a selected post with no comments', () => {
        renderDashComments({ comments: [] });

        expect(screen.getByText('No comments found for this post.')).toBeInTheDocument();
    });

    it('calls onDelete with the selected comment id', () => {
        const onDelete = vi.fn();
        renderDashComments({ onDelete });

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledWith(comment.id);
    });

    it('disables delete while the comment is being deleted', () => {
        renderDashComments({ deleting: `comments-${comment.id}` });

        expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    });

    it('uses independent pagination callbacks for posts and comments', () => {
        const onPostPageChange = vi.fn();
        const onCommentPageChange = vi.fn();
        renderDashComments({ postPagination: pagination, commentPagination: pagination, onPostPageChange, onCommentPageChange });

        const paginations = screen.getAllByRole('navigation');
        fireEvent.click(paginations[0].querySelector('[data-testid="pagination-next"]')!);
        fireEvent.click(paginations[1].querySelector('[data-testid="pagination-next"]')!);

        expect(onPostPageChange).toHaveBeenCalledWith(2);
        expect(onCommentPageChange).toHaveBeenCalledWith(2);
    });
});
