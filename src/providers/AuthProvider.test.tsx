import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContextType, CreatePostInput, LoginResponse, Post, User } from '../types';
import { AuthProvider, useAuth } from './AuthProvider';

const { mockLogin, mockLogout, mockRefresh } = vi.hoisted(() => ({
    mockLogin: vi.fn(), mockLogout: vi.fn(), mockRefresh: vi.fn(),
}));
vi.mock('../services/authService.ts', () => ({
    authService: { login: mockLogin, logout: mockLogout, refresh: mockRefresh },
}));

const SESSION_KEY = 'blog-app-session';
const user: User = {
    id: 11, name: 'Alex Johnson', username: 'alexj', email: 'alex@example.com',
    avatar: null, bio: 'Bio', phone: '+123456', roles: ['admin'], last_login: null,
    created_at: '2026-11-20T00:00:00Z', updated_at: '2026-11-20T00:00:00Z',
};
const loginResponse: LoginResponse = {
    access_token: 'access-token', token_type: 'bearer', expires_in: 3600, user,
};
const post: Post = {
    id: 9, title: 'Post', slug: 'post', content: 'Body', excerpt: '', image: '', status: 'draft',
    categoryId: null, tags: [], views: 0, likes: 0, dislikes: 0, commentsCount: 0,
    isFeatured: false, publishedAt: null, createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z', userId: user.id,
};
const input: CreatePostInput = {
    title: post.title, slug: post.slug, content: post.content, excerpt: '', image: '',
    status: 'draft', categoryId: null, tags: [], isFeatured: false,
};
const comment = {
    id: 5, postId: 9, authorId: 11, parentId: null, content: 'Comment',
    createdAt: '2026-11-20T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z', replies: [],
};

const mockFetch = vi.fn();
let currentAuth: AuthContextType | null = null;
const CaptureAuth = ({ children }: { children?: ReactNode }) => {
    currentAuth = useAuth();
    return <>{children}</>;
};

const apiResponse = (body: unknown, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) }) as unknown as Response;

function seedSession(overrides: Partial<{ access_token: string; expires_at: number; user: User }> = {}) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        access_token: 'stored-token', expires_at: Date.now() + 3_600_000, user, ...overrides,
    }));
}

function mountProvider() {
    return render(<AuthProvider><CaptureAuth /></AuthProvider>);
}

const auth = () => {
    if (!currentAuth) throw new Error('Auth context has not mounted');
    return currentAuth;
};

describe('AuthProvider', () => {
    beforeEach(() => {
        sessionStorage.clear();
        currentAuth = null;
        vi.clearAllMocks();
        vi.stubGlobal('fetch', mockFetch);
        mockLogin.mockResolvedValue(loginResponse);
        mockLogout.mockResolvedValue(undefined);
        mockRefresh.mockResolvedValue({ access_token: 'refreshed-token', expires_in: 3600 });
        mockFetch.mockResolvedValue(apiResponse({}));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('provides a guest session when storage is empty and rejects protected actions', async () => {
        mountProvider();

        expect(auth().isAuthenticated).toBe(false);
        expect(auth().user).toBeNull();
        expect(auth().accessToken).toBeNull();
        await expect(auth().updateUser({ name: 'A', bio: '', phone: null })).rejects.toThrow('You must be logged in to update your profile');
        await expect(auth().uploadAvatar(new File(['a'], 'a.png'))).rejects.toThrow('You must be logged in to update your avatar');
        await expect(auth().createComment(1, 'Hi')).rejects.toThrow('You must be logged in to comment');
        await expect(auth().deleteComment(1)).rejects.toThrow('You must be logged in to delete comments');
        await expect(auth().deletePost(1)).rejects.toThrow('You must be logged in to delete posts');
        await expect(auth().updatePost(1, input)).rejects.toThrow('You must be logged in to edit posts');
        await expect(auth().reactToPost(1, 'like')).rejects.toThrow('You must be logged in to react to a post');
        await expect(auth().createPost(input)).rejects.toThrow('You must be logged in to create posts');
    });

    it('throws when useAuth is called outside the provider', () => {
        const Consumer = () => { useAuth(); return null; };
        expect(() => render(<Consumer />)).toThrow('useAuth must be used within AuthProvider');
    });

    it('removes invalid session JSON from storage', () => {
        sessionStorage.setItem(SESSION_KEY, '{invalid');
        mountProvider();

        expect(auth().user).toBeNull();
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('logs in, persists the session, and exposes the authenticated user', async () => {
        mountProvider();

        await act(async () => {
            await auth().login({ login: 'alexj', password: 'secret' });
        });

        expect(mockLogin).toHaveBeenCalledWith({ login: 'alexj', password: 'secret' });
        expect(auth().isAuthenticated).toBe(true);
        expect(auth().user).toEqual(user);
        expect(auth().accessToken).toBe('access-token');
        expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user).toEqual(user);
    });

    it('propagates login failures without creating a session', async () => {
        mockLogin.mockRejectedValue(new Error('Bad credentials'));
        mountProvider();

        await expect(auth().login({ login: 'alexj', password: 'wrong' })).rejects.toThrow('Bad credentials');
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
        expect(auth().isAuthenticated).toBe(false);
    });

    it('clears local session on logout even when the backend logout fails', async () => {
        seedSession();
        mockLogout.mockRejectedValue(new Error('Server unavailable'));
        mountProvider();

        await act(async () => { await expect(auth().logout()).rejects.toThrow('Server unavailable'); });

        expect(auth().isAuthenticated).toBe(false);
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('logs out successfully and clears the stored session', async () => {
        seedSession();
        mountProvider();

        await act(async () => { await auth().logout(); });

        expect(mockLogout).toHaveBeenCalledOnce();
        expect(auth().isAuthenticated).toBe(false);
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('sends authenticated API requests for profile, avatar, comments, reactions, and posts', async () => {
        seedSession();
        const updatedUser = { ...user, name: 'Alex Updated' };
        mockFetch
            .mockResolvedValueOnce(apiResponse(updatedUser))
            .mockResolvedValueOnce(apiResponse({ avatar_url: '/uploads/new.webp' }))
            .mockResolvedValueOnce(apiResponse(comment))
            .mockResolvedValueOnce(apiResponse({ postId: 9, likes: 8, dislikes: 1 }))
            .mockResolvedValueOnce(apiResponse(post))
            .mockResolvedValueOnce(apiResponse(post))
            .mockResolvedValueOnce(apiResponse({}))
            .mockResolvedValueOnce(apiResponse({}));
        mountProvider();
        const image = new File(['image'], 'avatar.png', { type: 'image/png' });

        await act(async () => { await auth().updateUser({ name: 'Alex Updated', bio: 'Updated bio', phone: null }); });
        await act(async () => { await auth().uploadAvatar(image); });
        await act(async () => { await auth().createComment(9, 'Comment', 2); });
        await act(async () => { await auth().reactToPost(9, 'like'); });
        await act(async () => { await auth().createPost(input); });
        await act(async () => { await auth().updatePost(9, input); });
        await act(async () => { await auth().deletePost(9); });
        await act(async () => { await auth().deleteComment(5); });

        expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:8000/api/users/11', expect.objectContaining({ method: 'PATCH' }));
        expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:8000/api/users/11/avatar', expect.objectContaining({ method: 'POST' }));
        expect(mockFetch).toHaveBeenNthCalledWith(3, 'http://localhost:8000/api/posts/9/comments', expect.objectContaining({ method: 'POST' }));
        expect(mockFetch).toHaveBeenNthCalledWith(4, 'http://localhost:8000/api/posts/9/like', expect.objectContaining({ method: 'POST' }));
        expect(mockFetch).toHaveBeenNthCalledWith(5, 'http://localhost:8000/api/posts', expect.objectContaining({ method: 'POST' }));
        expect(mockFetch).toHaveBeenNthCalledWith(6, 'http://localhost:8000/api/posts/9', expect.objectContaining({ method: 'PATCH' }));
        expect(mockFetch).toHaveBeenNthCalledWith(7, 'http://localhost:8000/api/posts/9', expect.objectContaining({ method: 'DELETE' }));
        expect(mockFetch).toHaveBeenNthCalledWith(8, 'http://localhost:8000/api/comments/5', expect.objectContaining({ method: 'DELETE' }));
        expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user).toMatchObject({ name: 'Alex Updated', avatar: '/uploads/new.webp' });
    });

    it('refreshes a profile and updates the stored session only for the logged-in user', async () => {
        seedSession();
        mockFetch
            .mockResolvedValueOnce(apiResponse({ ...user, name: 'Fresh name' }))
            .mockResolvedValueOnce(apiResponse({ ...user, id: 22, name: 'Other user' }));
        mountProvider();

        const ownProfile = await act(async () => auth().refreshUser(11));
        expect(ownProfile.name).toBe('Fresh name');
        expect(auth().user?.name).toBe('Fresh name');
        expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user.name).toBe('Fresh name');

        const otherProfile = await act(async () => auth().refreshUser(22));
        expect(otherProfile.id).toBe(22);
        expect(auth().user?.id).toBe(11);
        expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:8000/api/users/11', expect.anything());
        expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:8000/api/users/22', expect.anything());
    });

    it('propagates API error details for profile and comment requests', async () => {
        seedSession();
        mockFetch
            .mockResolvedValueOnce(apiResponse({}, false))
            .mockResolvedValueOnce(apiResponse({ detail: 'Invalid profile' }, false))
            .mockResolvedValueOnce(apiResponse({}, false))
            .mockResolvedValueOnce(apiResponse({ detail: 'Cannot comment' }, false));
        mountProvider();

        await expect(auth().refreshUser(11)).rejects.toThrow('Could not load user profile');
        await expect(auth().updateUser({ name: 'x', bio: '', phone: null })).rejects.toThrow('Invalid profile');
        await expect(auth().createComment(9, 'x')).rejects.toThrow('Could not add comment');
        await expect(auth().createComment(9, 'x')).rejects.toThrow('Cannot comment');
    });

    it('enforces admin-only comment deletion and editor/admin post permissions', async () => {
        seedSession({ user: { ...user, roles: ['user'] } });
        mountProvider();

        await expect(auth().deleteComment(5)).rejects.toThrow('Only administrators can delete comments');
        await expect(auth().deletePost(9)).rejects.toThrow('Only editors and administrators can delete posts');
        await expect(auth().updatePost(9, input)).rejects.toThrow('Only editors and administrators can edit posts');
        await expect(auth().createPost(input)).rejects.toThrow('Only editors and administrators can create posts');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses API error details for avatar, delete, update, reaction, and post creation failures', async () => {
        seedSession();
        mockFetch.mockResolvedValue(apiResponse({ detail: 'Denied' }, false));
        mountProvider();
        const image = new File(['image'], 'avatar.png', { type: 'image/png' });

        await expect(auth().uploadAvatar(image)).rejects.toThrow('Denied');
        await expect(auth().deleteComment(5)).rejects.toThrow('Denied');
        await expect(auth().deletePost(9)).rejects.toThrow('Denied');
        await expect(auth().updatePost(9, input)).rejects.toThrow('Denied');
        await expect(auth().reactToPost(9, 'dislike')).rejects.toThrow('Denied');
        await expect(auth().createPost(input)).rejects.toThrow('Denied');
    });

    it('uses fallback errors when response details or avatar response are missing', async () => {
        seedSession();
        mockFetch
            .mockResolvedValueOnce(apiResponse({}, false))
            .mockResolvedValueOnce(apiResponse({}, true))
            .mockResolvedValueOnce(apiResponse({}, false));
        mountProvider();
        const image = new File(['image'], 'avatar.png', { type: 'image/png' });

        await expect(auth().uploadAvatar(image)).rejects.toThrow('Could not upload avatar');
        await expect(auth().uploadAvatar(image)).rejects.toThrow('Avatar uploaded, but the server did not return its URL');
        await expect(auth().createPost(input)).rejects.toThrow('Could not create post');
    });

    it('uses fallback errors when error response bodies cannot be parsed', async () => {
        seedSession();
        const invalidJsonResponse = { ok: false, json: vi.fn().mockRejectedValue(new Error('invalid json')) } as unknown as Response;
        mockFetch.mockResolvedValue(invalidJsonResponse);
        mountProvider();
        const image = new File(['image'], 'avatar.png', { type: 'image/png' });

        await expect(auth().updateUser({ name: 'A', bio: '', phone: null })).rejects.toThrow('Could not update profile');
        await expect(auth().uploadAvatar(image)).rejects.toThrow('Could not upload avatar');
        await expect(auth().createComment(9, 'x')).rejects.toThrow('Could not add comment');
        await expect(auth().deleteComment(5)).rejects.toThrow('Could not delete comment');
        await expect(auth().deletePost(9)).rejects.toThrow('Could not delete post');
        await expect(auth().updatePost(9, input)).rejects.toThrow('Could not update post');
        await expect(auth().reactToPost(9, 'like')).rejects.toThrow('Could not like this post');
        await expect(auth().createPost(input)).rejects.toThrow('Could not create post');
    });

    it('supports string and url avatar upload responses', async () => {
        seedSession();
        mockFetch
            .mockResolvedValueOnce(apiResponse('/avatar/from-string.png'))
            .mockResolvedValueOnce(apiResponse({ url: '/avatar/from-url.png' }));
        mountProvider();
        const image = new File(['image'], 'avatar.png', { type: 'image/png' });

        await act(async () => { await auth().uploadAvatar(image); });
        expect(auth().user?.avatar).toBe('/avatar/from-string.png');
        await act(async () => { await auth().uploadAvatar(image); });
        expect(auth().user?.avatar).toBe('/avatar/from-url.png');
    });

    it('renews an existing session when the refresh timer fires', async () => {
        vi.useFakeTimers();
        seedSession({ expires_at: Date.now() + 60_000 });
        mockRefresh.mockResolvedValue({ access_token: 'next-token', expires_in: 3600, user: { ...user, name: 'Renewed user' } });
        mountProvider();

        await act(async () => { await vi.advanceTimersByTimeAsync(0); });

        expect(auth().accessToken).toBe('next-token');
        expect(auth().user?.name).toBe('Renewed user');
        expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).access_token).toBe('next-token');
    });

    it('clears an expired session if automatic token refresh fails after expiry', async () => {
        vi.useFakeTimers();
        seedSession({ expires_at: Date.now() - 1 });
        mockRefresh.mockRejectedValue(new Error('Refresh failed'));
        mountProvider();

        await act(async () => { await vi.advanceTimersByTimeAsync(0); });

        expect(auth().isAuthenticated).toBe(false);
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('keeps the session briefly after a failed refresh, then clears it when it expires', async () => {
        vi.useFakeTimers();
        seedSession({ expires_at: Date.now() + 70_000 });
        mockRefresh.mockRejectedValue(new Error('Temporary refresh failure'));
        mountProvider();

        await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
        expect(auth().isAuthenticated).toBe(true);
        expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();

        await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
        expect(auth().isAuthenticated).toBe(false);
        expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
});
