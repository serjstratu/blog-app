import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';

const { mockUseAuth, mockFetchResult, mockFire, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockFetchResult: vi.fn(),
    mockFire: vi.fn(),
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
}));

vi.mock('../../providers/AuthProvider', () => ({ useAuth: mockUseAuth }));
vi.mock('sweetalert2', () => ({ default: { fire: mockFire } }));
vi.mock('react-toastify', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));
vi.mock('../../components', async () => {
    const actual = await vi.importActual<typeof import('../../components')>('../../components');
    return {
        ...actual,
        Loader: () => <div role="status">Loading</div>,
        Pagination: ({ currentPage, onPageChange }: { currentPage: number; onPageChange: (page: number) => void }) => (
            <div data-testid="pagination"><button type="button" onClick={() => onPageChange(currentPage + 1)}>Next mock page</button></div>
        ),
    };
});

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
    return renderWithQueryClient(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post/edit/:id" element={<p>Edit post route</p>} />
                <Route path="/" element={<p>Home page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => mockFetchResult(url, init?.headers).then((data: unknown) => ({
            ok: true, status: 200, json: () => Promise.resolve(data),
        }))));
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token',
            deletePost: vi.fn().mockResolvedValue(undefined), deleteComment: vi.fn().mockResolvedValue(undefined),
        });
        mockFetchResult.mockImplementation((url: string) => Promise.resolve(
            url.includes('/comments') ? { data: [comment], pagination } : { data: [post], pagination },
        ));
        mockFire.mockResolvedValue({ isConfirmed: true });
    });

    it('loads posts for admins and links to new post creation', async () => {
        renderDashboard();

        expect(await screen.findByRole('link', { name: 'Dashboard post' })).toHaveAttribute('href', '/post/dashboard-post');
        expect(screen.getByRole('link', { name: /new post/i })).toHaveAttribute('href', '/add');
        expect(mockFetchResult).toHaveBeenCalledWith(
            expect.stringContaining('include_unpublished=true'),
            expect.objectContaining({ Authorization: 'Bearer token' }),
        );
    });

    it('opens the edit page for the selected post', async () => {
        renderDashboard();
        await screen.findByRole('link', { name: 'Dashboard post' });

        fireEvent.click(screen.getByRole('button', { name: 'Edit Dashboard post' }));

        expect(await screen.findByText('Edit post route')).toBeInTheDocument();
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
        expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining(`/comments?postId=${post.id}&limit=`), expect.anything());
    });

    it('handles the comments endpoint returning an array without pagination', async () => {
        mockFetchResult.mockImplementation((url: string) => Promise.resolve(
            url.includes('/comments') ? [comment] : { data: [post], pagination },
        ));
        renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: String(post.id) } });

        expect(await screen.findByText('Dashboard comment')).toBeInTheDocument();
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('shows an error when loading posts fails', async () => {
        mockFetchResult.mockRejectedValueOnce(new Error('Posts failed'));
        renderDashboard();

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Posts failed'));
    });

    it('shows a fallback error when loading comments fails', async () => {
        mockFetchResult.mockImplementation((url: string) => url.includes('/comments')
            ? Promise.reject('unexpected')
            : Promise.resolve({ data: [post], pagination }));
        renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: String(post.id) } });

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not load comments'));
    });

    it('cancels a post deletion when confirmation is declined', async () => {
        mockFire.mockResolvedValue({ isConfirmed: false });
        const deletePost = vi.fn();
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token', deletePost, deleteComment: vi.fn(),
        });
        renderDashboard();
        await screen.findByRole('link', { name: 'Dashboard post' });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Dashboard post' }));

        await waitFor(() => expect(mockFire).toHaveBeenCalled());
        expect(deletePost).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'Dashboard post' })).toBeInTheDocument();
    });

    it('removes a post after confirmation and reports success', async () => {
        const deletePost = vi.fn().mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token', deletePost, deleteComment: vi.fn(),
        });
        renderDashboard();
        await screen.findByRole('link', { name: 'Dashboard post' });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Dashboard post' }));

        await waitFor(() => expect(deletePost).toHaveBeenCalledWith(post.id));
        expect(await screen.findByText('No posts found.')).toBeInTheDocument();
        expect(mockToastSuccess).toHaveBeenCalledWith('Post deleted.');
    });

    it('reports a post deletion error and keeps the post listed', async () => {
        const deletePost = vi.fn().mockRejectedValue(new Error('Delete failed'));
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token', deletePost, deleteComment: vi.fn(),
        });
        renderDashboard();
        await screen.findByRole('link', { name: 'Dashboard post' });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Dashboard post' }));

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Delete failed'));
        expect(screen.getByRole('link', { name: 'Dashboard post' })).toBeInTheDocument();
    });

    it('uses the fallback message when post deletion rejects with a non-Error', async () => {
        const deletePost = vi.fn().mockRejectedValue('unexpected');
        mockUseAuth.mockReturnValue({
            user: { id: 1, roles: ['admin'] }, accessToken: 'token', deletePost, deleteComment: vi.fn(),
        });
        renderDashboard();
        await screen.findByRole('link', { name: 'Dashboard post' });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Dashboard post' }));

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not delete post'));
    });

    it('ignores a posts response after the dashboard unmounts', async () => {
        let rejectPosts!: (reason: unknown) => void;
        mockFetchResult.mockImplementation(() => new Promise((_resolve, reject) => { rejectPosts = reject; }));
        const { unmount } = renderDashboard();
        unmount();
        rejectPosts(new Error('late posts failure'));
        await waitFor(() => expect(mockFetchResult).toHaveBeenCalled());

        expect(mockToastError).not.toHaveBeenCalled();
    });

    it('ignores a comments response after the dashboard unmounts', async () => {
        let resolveComments!: (response: unknown) => void;
        mockFetchResult.mockImplementation((url: string) => url.includes('/comments')
            ? new Promise((resolve) => { resolveComments = resolve; })
            : Promise.resolve({ data: [post], pagination }));
        const { unmount } = renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: String(post.id) } });
        await waitFor(() => expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining('/comments?'), expect.anything()));
        unmount();
        resolveComments({ data: [comment], pagination });
        await waitFor(() => expect(mockToastError).not.toHaveBeenCalled());
    });

    it('resets the selected post and returns to the posts tab', async () => {
        renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.change(screen.getByLabelText('Comments for post'), { target: { value: String(post.id) } });
        await screen.findByText('Dashboard comment');
        fireEvent.click(screen.getByRole('tab', { name: 'Posts' }));

        expect(await screen.findByRole('link', { name: 'Dashboard post' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        expect(await screen.findByText('Select a post to view its comments.')).toBeInTheDocument();
    });

    it('moves to another posts page from the comments filter', async () => {
        const multiplePages = { ...pagination, totalItems: 21, totalPages: 2, hasNextPage: true };
        mockFetchResult.mockResolvedValue({ data: [post], pagination: multiplePages });
        renderDashboard();
        fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
        await screen.findByRole('option', { name: /Dashboard post/ });
        fireEvent.click(screen.getByRole('button', { name: 'Next mock page' }));

        await waitFor(() => expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining('offset=20'), expect.anything()));
        expect(await screen.findByText('Select a post to view its comments.')).toBeInTheDocument();
    });

    it('redirects users without admin role away from the dashboard', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 2, roles: ['user'] }, accessToken: null });
        renderDashboard();

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mockFetchResult).not.toHaveBeenCalled();
    });

    it('lets editors see only their own posts', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 11, roles: ['editor'] }, accessToken: 'editor-token',
            deletePost: vi.fn(), deleteComment: vi.fn(),
        });

        renderDashboard();

        expect(await screen.findByRole('link', { name: 'Dashboard post' })).toBeInTheDocument();
        expect(mockFetchResult).toHaveBeenCalledWith(
            expect.stringContaining('include_unpublished=true&user_id=11'),
            expect.objectContaining({ Authorization: 'Bearer editor-token' }),
        );
        expect(screen.queryByRole('tab', { name: 'Comments' })).not.toBeInTheDocument();
    });
});
