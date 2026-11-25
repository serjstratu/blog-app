import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post as PostData } from '../../types';
import Post from './Post';

const { mockUseAuth, mockGetJson, mockFindPostBySlug, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(), mockGetJson: vi.fn(), mockFindPostBySlug: vi.fn(), mockToastError: vi.fn(), mockToastSuccess: vi.fn(),
}));
vi.mock('../../providers/AuthProvider.tsx', () => ({ useAuth: mockUseAuth }));
vi.mock('../../config/getJson.ts', () => ({ getJson: mockGetJson }));
vi.mock('../../api/posts.ts', () => ({ findPostBySlug: mockFindPostBySlug }));
vi.mock('react-toastify', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));
vi.mock('../../components', () => ({ Comments: () => <div data-testid="post-comments" /> }));
vi.mock('./component/PostStats/PostStats.tsx', () => ({
    default: ({ views, likes, dislikes, commentsCount, isAuthenticated, reacting, onReact, isFavorite, onToggleFavorite }: {
        views: number; likes: number; dislikes: number; commentsCount: number;
        isAuthenticated: boolean; reacting: boolean; onReact: (reaction: 'like' | 'dislike') => void;
        isFavorite: boolean; onToggleFavorite: () => void;
    }) => (
        <div data-testid="post-stats">
            <span data-testid="stats-views">{views}</span>
            <span data-testid="stats-likes">{likes}</span>
            <span data-testid="stats-dislikes">{dislikes}</span>
            <span data-testid="stats-comments">{commentsCount}</span>
            {isAuthenticated && <>
                <button type="button" disabled={reacting} onClick={() => { onReact('like'); onReact('like'); }}>Like</button>
                <button type="button" disabled={reacting} onClick={() => onReact('dislike')}>Dislike</button>
                <button type="button" onClick={onToggleFavorite}>{isFavorite ? 'Remove favorite' : 'Add favorite'}</button>
            </>}
        </div>
    ),
}));

const createdDraft: PostData = {
    id: 97, title: 'test-test-lll', slug: 'test-test-lll', content: 'Draft body', excerpt: 'ssadsa', image: '',
    status: 'draft', categoryId: null, tags: ['react'], views: 0, likes: 0, dislikes: 0, commentsCount: 0,
    isFeatured: false, publishedAt: null, createdAt: '2026-11-24T16:06:50.233976+02:00',
    updatedAt: '2026-11-24T16:06:50.233976+02:00', userId: 1,
};
const publishedPost: PostData = {
    ...createdDraft, id: 14, slug: 'react-basics', title: 'React basics', status: 'published',
    image: 'https://example.com/cover.png', excerpt: 'A React introduction',
    views: 10, likes: 2, dislikes: 1, commentsCount: 3, isFeatured: true,
};

function renderPost(pathname: string, state?: { createdPost?: PostData }) {
    return render(
        <MemoryRouter initialEntries={[{ pathname, state }] }>
            <Routes>
                <Route path="/post/:id" element={<Post />} />
                <Route path="/post" element={<Post />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Post page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({ user: { id: 1 }, reactToPost: vi.fn(), getFavorites: vi.fn().mockResolvedValue({ postIds: [], data: [], pagination: {} }), addFavorite: vi.fn(), removeFavorite: vi.fn() });
    });

    it('renders a newly created draft from navigation state without requesting the hidden draft', async () => {
        renderPost(`/post/${createdDraft.slug}`, { createdPost: createdDraft });

        expect(await screen.findByRole('heading', { name: createdDraft.title })).toBeInTheDocument();
        expect(screen.getByText(createdDraft.content)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Comments will be available when this post is published.');
        expect(screen.queryByTestId('post-comments')).not.toBeInTheDocument();
        expect(mockGetJson).not.toHaveBeenCalled();
        expect(mockFindPostBySlug).not.toHaveBeenCalled();
    });

    it('loads a published post by numeric id and renders its details and comments', async () => {
        mockGetJson.mockResolvedValue(publishedPost);

        renderPost(`/post/${publishedPost.id}`);

        expect(await screen.findByRole('heading', { name: publishedPost.title })).toBeInTheDocument();
        expect(mockGetJson).toHaveBeenCalledWith(`http://localhost:8000/api/posts/${publishedPost.id}`);
        expect(screen.getByAltText('')).toHaveAttribute('src', publishedPost.image);
        expect(screen.getByText(publishedPost.excerpt!)).toBeInTheDocument();
        expect(screen.getByText('Featured')).toBeInTheDocument();
        expect(screen.getByTestId('post-comments')).toBeInTheDocument();
    });

    it('resolves a slug to a post and then loads its full details', async () => {
        mockFindPostBySlug.mockResolvedValue({ ...publishedPost, id: publishedPost.id });
        mockGetJson.mockResolvedValue(publishedPost);

        renderPost(`/post/${publishedPost.slug}`);

        expect(await screen.findByRole('heading', { name: publishedPost.title })).toBeInTheDocument();
        expect(mockFindPostBySlug).toHaveBeenCalledWith(publishedPost.slug);
        expect(mockGetJson).toHaveBeenCalledWith(`http://localhost:8000/api/posts/${publishedPost.id}`);
    });

    it('shows a not-found state and a toast when loading the post fails', async () => {
        mockGetJson.mockRejectedValue(new Error('Post request failed'));

        renderPost('/post/404');

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to blog' })).toHaveAttribute('href', '/blog');
        expect(mockToastError).toHaveBeenCalledWith('Post request failed');
    });

    it('uses a fallback toast for non-Error loading failures', async () => {
        mockGetJson.mockRejectedValue('unexpected');

        renderPost('/post/404');

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(mockToastError).toHaveBeenCalledWith('Could not load this post');
    });

    it('reacts to a post, updates counts, and prevents duplicate reactions while pending', async () => {
        let resolveReaction!: (value: { likes: number; dislikes: number }) => void;
        const reactToPost = vi.fn(() => new Promise<{ likes: number; dislikes: number }>((resolve) => {
            resolveReaction = resolve;
        }));
        mockUseAuth.mockReturnValue({ user: { id: 1 }, reactToPost, getFavorites: vi.fn().mockResolvedValue({ postIds: [], data: [], pagination: {} }), addFavorite: vi.fn(), removeFavorite: vi.fn() });
        mockGetJson.mockResolvedValue(publishedPost);

        renderPost(`/post/${publishedPost.id}`);
        await screen.findByRole('heading', { name: publishedPost.title });
        fireEvent.click(screen.getByRole('button', { name: 'Like' }));

        expect(reactToPost).toHaveBeenCalledTimes(1);
        expect(reactToPost).toHaveBeenCalledWith(publishedPost.id, 'like');
        expect(screen.getByRole('button', { name: 'Like' })).toBeDisabled();
        resolveReaction({ likes: 3, dislikes: 1 });

        await waitFor(() => expect(screen.getByTestId('stats-likes')).toHaveTextContent('3'));
        expect(screen.getByRole('button', { name: 'Like' })).toBeEnabled();
    });

    it('reports a failed like action and re-enables reaction buttons', async () => {
        const reactToPost = vi.fn().mockRejectedValue(new Error('Reaction failed'));
        mockUseAuth.mockReturnValue({ user: { id: 1 }, reactToPost, getFavorites: vi.fn().mockResolvedValue({ postIds: [], data: [], pagination: {} }), addFavorite: vi.fn(), removeFavorite: vi.fn() });
        mockGetJson.mockResolvedValue(publishedPost);

        renderPost(`/post/${publishedPost.id}`);
        await screen.findByRole('heading', { name: publishedPost.title });
        fireEvent.click(screen.getByRole('button', { name: 'Dislike' }));

        await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Reaction failed'));
        expect(reactToPost).toHaveBeenCalledWith(publishedPost.id, 'dislike');
        expect(screen.getByRole('button', { name: 'Dislike' })).toBeEnabled();
    });

    it('does not request the API when the route has no post identifier', async () => {
        renderPost('/post');

        expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
        expect(mockGetJson).not.toHaveBeenCalled();
        expect(mockFindPostBySlug).not.toHaveBeenCalled();
    });

    it('adds a published post to favorites and confirms the action', async () => {
        const addFavorite = vi.fn().mockResolvedValue(undefined);
        const getFavorites = vi.fn().mockResolvedValue({ postIds: [], data: [], pagination: {} });
        mockUseAuth.mockReturnValue({ user: { id: 1 }, reactToPost: vi.fn(), getFavorites, addFavorite, removeFavorite: vi.fn() });
        mockGetJson.mockResolvedValue(publishedPost);
        renderPost(`/post/${publishedPost.id}`);

        fireEvent.click(await screen.findByRole('button', { name: 'Add favorite' }));
        await waitFor(() => expect(addFavorite).toHaveBeenCalledWith(publishedPost.id));
        expect(mockToastSuccess).toHaveBeenCalledWith('Post added to favorites');
        expect(await screen.findByRole('button', { name: 'Remove favorite' })).toBeInTheDocument();
    });
});
