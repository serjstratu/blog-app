import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Comments from './Comments';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';

const { mockFetchResult, mockUseAuth, mockToastError, mockToastSuccess, mockSwalFire } = vi.hoisted(() => ({
    mockFetchResult: vi.fn(), mockUseAuth: vi.fn(), mockToastError: vi.fn(), mockToastSuccess: vi.fn(), mockSwalFire: vi.fn(),
}));

vi.mock('../../providers/AuthProvider', () => ({ useAuth: mockUseAuth }));
vi.mock('react-toastify', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));
vi.mock('sweetalert2', () => ({ default: { fire: mockSwalFire } }));
vi.mock('../index.ts', () => ({
    Loader: ({ label }: { label: string }) => <div role="status">{label}</div>,
    Pagination: ({ currentPage, onPageChange }: { currentPage: number; onPageChange: (page: number) => void }) => (
        <nav aria-label="Comments pages"><button type="button" onClick={() => onPageChange(currentPage + 1)}>Next page</button></nav>
    ),
}));

const pagination = {
    currentPage: 1, perPage: 20, totalItems: 2, totalPages: 2,
    hasNextPage: true, hasPreviousPage: false,
};
const reply = {
    id: 2, postId: 7, authorId: 12, parentId: 1, content: 'An earlier reply',
    createdAt: '2026-11-24T08:00:00Z', updatedAt: '2026-11-24T08:00:00Z', replies: [],
    author: { id: 12, username: 'reader2', avatar: 'https://example.com/reader.png' },
};
const comment = {
    id: 1, postId: 7, authorId: 11, parentId: null, content: 'A helpful comment',
    createdAt: '2026-11-24T09:00:00Z', updatedAt: '2026-11-24T09:00:00Z', replies: [reply],
    author: { id: 11, name: 'Alex Reader', avatar: '/uploads/alex.webp' },
};
const anotherComment = {
    id: 3, postId: 7, authorId: 13, parentId: null, content: 'Deleted text',
    createdAt: '2026-11-24T10:00:00Z', updatedAt: '2026-11-24T10:00:00Z',
    deletedAt: '2026-11-24T10:01:00Z', replies: [], author_name: 'Former User',
};

const renderComments = () => renderWithQueryClient(<Comments postId={7} />);

describe('Comments', () => {
    const createComment = vi.fn();
    const deleteComment = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn((url: string) => mockFetchResult(url).then((data: unknown) => ({
            ok: true, status: 200, json: () => Promise.resolve(data),
        }))));
        mockUseAuth.mockReturnValue({ user: null, createComment, deleteComment });
        mockFetchResult.mockResolvedValue({ data: [comment, anotherComment], pagination });
        mockSwalFire.mockResolvedValue({ isConfirmed: true });
        createComment.mockResolvedValue({});
        deleteComment.mockResolvedValue(undefined);
        window.history.replaceState({}, '', '/');
    });

    it('loads paginated comments and renders authors, nested replies, avatars, deleted content, and links', async () => {
        renderComments();

        expect(await screen.findByRole('heading', { name: 'Comments (2)' })).toBeInTheDocument();
        expect(mockFetchResult).toHaveBeenCalledWith('http://localhost:8000/api/comments?postId=7&limit=20&offset=0');
        expect(screen.getByText('A helpful comment')).toBeInTheDocument();
        expect(screen.getByText('An earlier reply')).toBeInTheDocument();
        expect(screen.getByText('Alex Reader')).toBeInTheDocument();
        expect(screen.getByText('reader2')).toBeInTheDocument();
        expect(screen.getByText('This comment was deleted.')).toBeInTheDocument();
        expect(screen.getByText('Former User')).toBeInTheDocument();
        expect(screen.getAllByRole('presentation')[0]).toHaveAttribute('src', 'http://localhost:8000/uploads/alex.webp');
        expect(screen.getByRole('navigation', { name: 'Comments pages' })).toBeInTheDocument();
        expect(screen.getByText('Log in to leave a comment.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete comment 1' })).not.toBeInTheDocument();
    });

    it('renders comments returned as an array and an empty state', async () => {
        mockFetchResult.mockResolvedValue([]);
        renderComments();

        expect(await screen.findByText('No comments yet.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Comments pages' })).not.toBeInTheDocument();
    });

    it('reports API failures with their message or a fallback', async () => {
        mockFetchResult.mockRejectedValueOnce(new Error('Comments unavailable'));
        renderComments();
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Comments unavailable'));

        mockFetchResult.mockRejectedValueOnce('unexpected');
        const { unmount } = renderComments();
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not load comments'));
        unmount();
    });

    it('submits a trimmed comment and reloads the list', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['user'] }, createComment, deleteComment });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.change(screen.getByLabelText('Write a comment'), { target: { value: '  New comment  ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));

        await waitFor(() => expect(createComment).toHaveBeenCalledWith(7, 'New comment', null));
        await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Comment added.'));
        expect(mockFetchResult).toHaveBeenCalledTimes(2);
        expect(screen.getByLabelText('Write a comment')).toHaveValue('');
    });

    it('allows replies and can cancel reply mode', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['user'] }, createComment, deleteComment });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[0]);

        expect(screen.getByText('Replying to comment by User 11')).toBeInTheDocument();
        expect(screen.getByLabelText('Write a reply')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel reply' }));
        expect(screen.getByLabelText('Write a comment')).toBeInTheDocument();
    });

    it('submits a reply with the parent comment id', async () => {
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['user'] }, createComment, deleteComment });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[0]);
        fireEvent.change(screen.getByLabelText('Write a reply'), { target: { value: '  Reply text  ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));

        await waitFor(() => expect(createComment).toHaveBeenCalledWith(7, 'Reply text', comment.id));
        expect(mockToastSuccess).toHaveBeenCalledWith('Reply added.');
    });

    it('reports comment submission errors', async () => {
        const failingCreate = vi.fn().mockRejectedValueOnce(new Error('Cannot post')).mockRejectedValueOnce('unknown');
        mockUseAuth.mockReturnValue({ user: { id: 11, roles: ['user'] }, createComment: failingCreate, deleteComment });
        renderComments();
        await screen.findByText('A helpful comment');
        const textarea = screen.getByLabelText('Write a comment');

        fireEvent.change(textarea, { target: { value: 'first' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Cannot post'));

        fireEvent.change(textarea, { target: { value: 'second' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not add comment'));
    });

    it('deletes comments after admin confirmation and reloads', async () => {
        const adminDelete = vi.fn().mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({ user: { id: 1, roles: ['admin'] }, createComment, deleteComment: adminDelete });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getByRole('button', { name: 'Delete comment 1' }));

        await waitFor(() => expect(adminDelete).toHaveBeenCalledWith(1));
        expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Delete comment?' }));
        expect(mockToastSuccess).toHaveBeenCalledWith('Comment deleted.');
        expect(mockFetchResult).toHaveBeenCalledTimes(2);
    });

    it('does not delete if the admin cancels confirmation', async () => {
        mockSwalFire.mockResolvedValue({ isConfirmed: false });
        const adminDelete = vi.fn();
        mockUseAuth.mockReturnValue({ user: { id: 1, roles: ['admin'] }, createComment, deleteComment: adminDelete });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getByRole('button', { name: 'Delete comment 1' }));

        await waitFor(() => expect(mockSwalFire).toHaveBeenCalled());
        expect(adminDelete).not.toHaveBeenCalled();
        expect(mockFetchResult).toHaveBeenCalledTimes(1);
    });

    it('reports errors from deleting comments', async () => {
        const adminDelete = vi.fn().mockRejectedValueOnce(new Error('Delete failed')).mockRejectedValueOnce('unknown');
        mockUseAuth.mockReturnValue({ user: { id: 1, roles: ['admin'] }, createComment, deleteComment: adminDelete });
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getByRole('button', { name: 'Delete comment 1' }));
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Delete failed'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete comment 1' }));
        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Could not delete comment.'));
    });

    it('changes page and requests the matching offset', async () => {
        renderComments();
        await screen.findByText('A helpful comment');
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

        await waitFor(() => expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining('offset=20')));
    });

    it('scrolls to and highlights a comment targeted by the page hash', async () => {
        window.history.replaceState({}, '', '/#comment-1');
        const scrollIntoView = vi.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
        renderComments();

        const target = await screen.findByText('A helpful comment');
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' }));
        expect(target.closest('#comment-1')).toHaveClass('comment--targeted');
        window.history.replaceState({}, '', '/');
    });

    it('loads additional comment pages while searching for a hash target', async () => {
        const targetComment = { ...comment, id: 21, content: 'Deep link target' };
        mockFetchResult.mockImplementation((url: string) => Promise.resolve(url.includes('offset=0')
            ? { data: [comment], pagination }
            : { data: [targetComment], pagination: { ...pagination, currentPage: 2, hasNextPage: false, hasPreviousPage: true } }));
        window.history.replaceState({}, '', '/#comment-21');
        const scrollIntoView = vi.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
        renderComments();

        expect(await screen.findByText('Deep link target')).toBeInTheDocument();
        expect(mockFetchResult).toHaveBeenCalledWith(expect.stringContaining('offset=20'));
        window.history.replaceState({}, '', '/');
    });
});
