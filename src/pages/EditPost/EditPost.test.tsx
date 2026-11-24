import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../../types';
import EditPost from './EditPost';

const { mockUseAuth, mockGetJson } = vi.hoisted(() => ({ mockUseAuth: vi.fn(), mockGetJson: vi.fn() }));
vi.mock('../../providers/AuthProvider', () => ({ useAuth: mockUseAuth }));
vi.mock('../../config/getJson', () => ({ getJson: mockGetJson }));

const post: Post = {
    id: 95, title: 'Editable post', slug: 'editable-post', content: '# Original', excerpt: 'Old excerpt', image: null,
    status: 'draft', categoryId: null, tags: ['react', 'blog'], views: 1, likes: 2, dislikes: 0,
    commentsCount: 0, isFeatured: true, publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', userId: 11,
};

function renderEditPost(initialPost: Post | null = post) {
    return render(
        <MemoryRouter initialEntries={[{
            pathname: `/post/edit/${post.id}`,
            state: initialPost ? { post: initialPost } : null,
        }]}
        >
            <Routes>
                <Route path="/post/edit/:id" element={<EditPost />} />
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
        mockUseAuth.mockReturnValue({
            user: { id: 11, roles: ['editor'] }, updatePost,
        });
    });

    it('fills the form with the post passed through router state', () => {
        renderEditPost();

        expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
        expect(screen.getByTestId('edit-post-title')).toHaveValue(post.title);
        expect(screen.getByTestId('edit-post-content')).toHaveValue(post.content);
        expect(screen.getByTestId('edit-post-tags')).toHaveValue('react, blog');
        expect(mockGetJson).not.toHaveBeenCalled();
    });

    it('loads the post from the API when opened directly', async () => {
        mockGetJson.mockResolvedValue(post);
        renderEditPost(null);

        expect(await screen.findByTestId('edit-post-title')).toHaveValue(post.title);
        expect(mockGetJson).toHaveBeenCalledWith(expect.stringContaining(`/posts/${post.id}`));
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
});
