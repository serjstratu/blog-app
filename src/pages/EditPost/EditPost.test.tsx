import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../../types';
import EditPost from './EditPost';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';

const { mockUseAuth, mockFetchResult, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(), mockFetchResult: vi.fn(), mockToastError: vi.fn(), mockToastSuccess: vi.fn(),
}));
vi.mock('../../providers/AuthProvider', () => ({ useAuth: mockUseAuth }));
vi.mock('react-toastify', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

const post: Post = {
    id: 95, title: 'Editable post', slug: 'editable-post', content: '# Original', excerpt: 'Old excerpt', image: null,
    status: 'draft', categoryId: null, tags: ['react', 'blog'], views: 1, likes: 2, dislikes: 0,
    commentsCount: 0, isFeatured: true, publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', userId: 11,
};

function renderEditPost(initialPost: Post | null = post, options: { id?: string; user?: { id: number; roles: string[] } } = {}) {
    const postId = options.id ?? String(post.id);
    return renderWithQueryClient(
        <MemoryRouter initialEntries={[{
            pathname: `/post/edit/${postId}`,
            state: initialPost ? { post: initialPost } : null,
        }]}
        >
            <Routes>
                <Route path="/post/edit/:id" element={<EditPost />} />
                <Route path="/post/edit" element={<EditPost />} />
                <Route path="/dashboard" element={<p>Dashboard route</p>} />
                <Route path="/user/:id" element={<p>User profile</p>} />
                <Route path="/" element={<p>Home route</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('EditPost page', () => {
    const updatePost = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => mockFetchResult(url, init?.headers).then((data: unknown) => ({
            ok: true, status: 200, json: () => Promise.resolve(data),
        }))));
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['editor'] }, updatePost });
    });

    it('fills the form with the post passed through router state', () => {
        renderEditPost();

        expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
        expect(screen.getByTestId('edit-post-title')).toHaveValue(post.title);
        expect(screen.getByTestId('edit-post-content')).toHaveValue(post.content);
        expect(screen.getByTestId('edit-post-tags')).toHaveValue('react, blog');
        expect(mockFetchResult).not.toHaveBeenCalled();
    });

    it('loads the post from the API when opened directly', async () => {
        mockFetchResult.mockResolvedValue(post);
        renderEditPost(null);

        expect(await screen.findByTestId('edit-post-title')).toHaveValue(post.title);
        expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining(`/posts/${post.id}`), expect.anything());
    });

    it('submits changes and returns to the dashboard', async () => {
        updatePost.mockResolvedValue({ ...post, title: 'Updated title' });
        renderEditPost();
        fireEvent.change(screen.getByTestId('edit-post-title'), { target: { value: 'Updated title' } });
        fireEvent.change(screen.getByTestId('edit-post-status'), { target: { value: 'published' } });
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        await waitFor(() => expect(updatePost).toHaveBeenCalledWith(post.id, expect.objectContaining({
            title: 'Updated title', slug: post.slug, content: post.content, status: 'published',
            categoryId: null, tags: ['react', 'blog'], isFeatured: true,
        })));
        expect(await screen.findByText('Dashboard route')).toBeInTheDocument();
    });

    it('redirects an editor away from another user’s post', async () => {
        const anotherUserPost = { ...post, userId: 42 };
        renderEditPost(anotherUserPost);

        expect(await screen.findByText('Dashboard route')).toBeInTheDocument();
    });

    it('redirects guests to the home page', async () => {
        mockUseAuth.mockReturnValue({ user: null, updatePost });
        renderEditPost();
        expect(await screen.findByText('Home route')).toBeInTheDocument();
        expect(mockFetchResult).not.toHaveBeenCalled();
    });

    it('redirects users without edit roles to their profile', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['user'] }, updatePost });
        renderEditPost();

        expect(await screen.findByText('User profile')).toBeInTheDocument();
        expect(mockFetchResult).not.toHaveBeenCalled();
    });

    it('shows a not-found state without an id and skips the API request', async () => {
        renderEditPost(null, { id: '' });

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/dashboard');
        expect(mockFetchResult).not.toHaveBeenCalled();
    });

    it('shows an error notification and not-found state when loading fails', async () => {
        mockFetchResult.mockRejectedValue(new Error('Cannot load post'));
        renderEditPost(null);

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(mockToastError).toHaveBeenCalledWith('Cannot load post');
    });

    it('uses a fallback notification when loading fails with an unknown value', async () => {
        mockFetchResult.mockRejectedValue('unexpected');
        renderEditPost(null);

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(mockToastError).toHaveBeenCalledWith('Could not load post');
    });

    it('allows administrators to edit another user’s post', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 1, roles: ['admin'] }, updatePost });
        renderEditPost({ ...post, userId: 42 });

        expect(await screen.findByTestId('edit-post')).toBeInTheDocument();
        expect(screen.getByTestId('edit-post-title')).toHaveValue(post.title);
    });

    it('reports update errors and keeps the form available for retry', async () => {
        updatePost.mockRejectedValueOnce(new Error('Update rejected')).mockRejectedValueOnce('unexpected');
        renderEditPost();
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Update rejected'));
        expect(screen.getByTestId('edit-post-form')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('edit-post-submit'));
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not update post'));
    });

    it('serializes category, image, and filtered tags when saving', async () => {
        updatePost.mockResolvedValue(post);
        renderEditPost();
        fireEvent.change(screen.getByTestId('edit-post-category'), { target: { value: '4' } });
        fireEvent.change(screen.getByTestId('edit-post-image'), { target: { value: 'https://example.com/cover.png' } });
        fireEvent.change(screen.getByTestId('edit-post-tags'), { target: { value: ' react, , typescript ' } });
        fireEvent.click(screen.getByTestId('edit-post-featured'));
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        await waitFor(() => expect(updatePost).toHaveBeenCalledWith(post.id, expect.objectContaining({
            categoryId: 4, image: 'https://example.com/cover.png', tags: ['react', 'typescript'], isFeatured: false,
        })));
        expect(mockToastSuccess).toHaveBeenCalledWith('Post updated successfully.');
    });
});
