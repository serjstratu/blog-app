import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

const { mockUseAuth, mockGetJson, mockFire } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockGetJson: vi.fn(),
    mockFire: vi.fn(),
}));

vi.mock('../../providers/AuthProvider', () => ({ useAuth: mockUseAuth }));
vi.mock('../../config/getJson', () => ({ getJson: mockGetJson }));
vi.mock('sweetalert2', () => ({ default: { fire: mockFire } }));
vi.mock('../../components', () => ({
    Loader: () => <div role="status">Loading</div>,
    Pagination: () => <div data-testid="pagination" />,
}));

const pagination = {
    currentPage: 1, perPage: 20, totalItems: 1, totalPages: 1,
    hasNextPage: false, hasPreviousPage: false,
};
const post = {
    id: 95, title: 'Dashboard post', slug: 'dashboard-post', content: 'Text', excerpt: '', image: '',
    status: 'published', categoryId: null, tags: [], views: 0, likes: 0, dislikes: 0,
    commentsCount: 1, isFeatured: false, publishedAt: null,
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', userId: 1,
};
const comment = {
    id: 12, postId: 95, authorId: 2, parentId: null, content: 'Dashboard comment',
    createdAt: '2026-11-23T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z', replies: [],
};

function renderDashboard() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/" element={<p>Home page</p>} /></Routes>
        </MemoryRouter>,
    );
}

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token',
            deletePost: vi.fn().mockResolvedValue(undefined), deleteComment: vi.fn().mockResolvedValue(undefined),
        });
        mockGetJson.mockImplementation((url: string) => Promise.resolve(
            url.includes('/comments') ? { data: [comment], pagination } : { data: [post], pagination },
        ));
        mockFire.mockResolvedValue({ isConfirmed: true });
    });

    it('loads posts for admins and links to new post creation', async () => {
        renderDashboard();

        expect(await screen.findByRole('link', { name: 'Dashboard post' })).toHaveAttribute('href', '/post/dashboard-post');
        expect(screen.getByRole('link', { name: /new post/i })).toHaveAttribute('href', '/add');
        expect(mockGetJson).toHaveBeenCalledWith(expect.stringContaining('/posts?limit='), expect.objectContaining({ Authorization: 'Bearer token' }));
    });

    it('shows comments and calls admin delete after confirmation', async () => {
        const deleteComment = vi.fn().mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token',
            deletePost: vi.fn(), deleteComment,
        });
        renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: String(post.id) } });

        expect(await screen.findByText('Dashboard comment')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteComment).toHaveBeenCalledWith(comment.id));
        expect(mockFire).toHaveBeenCalled();
        expect(mockGetJson).toHaveBeenCalledWith(expect.stringContaining(`/comments?postId=${post.id}&limit=`), expect.anything());
    });

    it('redirects users without admin role away from the dashboard', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 2, roles: ['user'] }, accessToken: null });
        renderDashboard();

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mockGetJson).not.toHaveBeenCalled();
    });

    it('lets editors see only their own posts', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 11, roles: ['editor'] }, accessToken: 'editor-token',
            deletePost: vi.fn(), deleteComment: vi.fn(),
        });

        renderDashboard();

        expect(await screen.findByRole('link', { name: 'Dashboard post' })).toBeInTheDocument();
        expect(mockGetJson).toHaveBeenCalledWith(
            expect.stringContaining('user_id=11'),
            expect.objectContaining({ Authorization: 'Bearer editor-token' }),
        );
        expect(screen.queryByRole('tab', { name: 'Comments' })).not.toBeInTheDocument();
    });
});
