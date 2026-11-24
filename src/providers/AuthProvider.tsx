import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type {AuthContextType, CreatePostInput, LoginRequest, LoginResponse,Comment,User} from "../types";
import {authService} from "../services/authService.ts";
import { API_URL } from '../config';

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'blog-app-session';
interface AuthSession {
    access_token: string;
    expires_at: number;
    user: User;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<AuthSession | null>(() => {
        const storedSession = sessionStorage.getItem(SESSION_KEY);

        if (!storedSession) return null;

        try {
            const parsedSession: AuthSession = JSON.parse(storedSession);

            return parsedSession;
        } catch {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
    });

    useEffect(() => {
        if (!session) return;
        let active = true;
        let expiryTimer: ReturnType<typeof setTimeout> | undefined;
        const refreshDelay = Math.max(0, session.expires_at - Date.now() - 60_000);
        const refreshTimer = setTimeout(() => {
            authService.refresh()
            .then((refreshed) => {
                if (!active) return;
                const updatedSession: AuthSession = {
                    ...session,
                    access_token: refreshed.access_token,
                    expires_at: Date.now() + refreshed.expires_in * 1000,
                    user: refreshed.user ?? session.user,
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
                setSession(updatedSession);
            })
            .catch(() => {
                if (!active) return;
                const remainingTime = session.expires_at - Date.now();
                if (remainingTime <= 0) {
                    sessionStorage.removeItem(SESSION_KEY);
                    setSession(null);
                    return;
                }
                expiryTimer = setTimeout(() => {
                    sessionStorage.removeItem(SESSION_KEY);
                    setSession(null);
                }, remainingTime);
            });
        }, refreshDelay);
        return () => {
            active = false;
            clearTimeout(refreshTimer);
            if (expiryTimer) clearTimeout(expiryTimer);
        };
    }, [session]);

    const login = async (credentials: LoginRequest): Promise<User> => {
        const response: LoginResponse = await authService.login(credentials);

        const newSession: AuthSession = {
            access_token: response.access_token,
            expires_at: Date.now() + response.expires_in * 1000,
            user: response.user,
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));

        setSession(newSession);
        return response.user;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            sessionStorage.removeItem(SESSION_KEY);
            setSession(null);
        }
    };

    const updateUser = async (updates: Pick<User, 'name' | 'bio' | 'phone'>) => {
        if (!session) throw new Error('You must be logged in to update your profile');
        const response = await fetch(`${API_URL}/users/${session.user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not update profile');
        }
        const result = await response.json();
        const updatedUser = { ...session.user, ...result, ...updates };
        const updatedSession = { ...session, user: updatedUser };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setSession(updatedSession);
    };

    const refreshUser = useCallback(async (id: number): Promise<User> => {
        const response = await fetch(`${API_URL}/users/${id}`, { headers: { accept: '*/*' } });
        if (!response.ok) throw new Error('Could not load user profile');
        const freshUser: User = await response.json();
        if (session && freshUser.id === session.user.id) {
            const updatedSession = { ...session, user: freshUser };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
            setSession(updatedSession);
        }
        return freshUser;
    }, []);

    const uploadAvatar = async (file: File) => {
        if (!session) throw new Error('You must be logged in to update your avatar');
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_URL}/users/${session.user.id}/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}`, accept: '*/*' },
            body: formData,
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not upload avatar');
        }
        const result = await response.json().catch(() => null);
        const avatar = typeof result === 'string' ? result : result?.avatar ?? result?.avatar_url ?? result?.url;
        if (!avatar) throw new Error('Avatar uploaded, but the server did not return its URL');
        const updatedSession = { ...session, user: { ...session.user, avatar } };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setSession(updatedSession);
    };

    const createComment = async (postId: number, content: string, parentId: number | null = null): Promise<Comment> => {
        if (!session) throw new Error('You must be logged in to comment');
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ content, parentId }),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not add comment');
        }
        return response.json() as Promise<Comment>;
    };

    const deleteComment = async (commentId: number): Promise<void> => {
        if (!session) throw new Error('You must be logged in to delete comments');
        if (!session.user.roles.includes('admin')) throw new Error('Only administrators can delete comments');
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { accept: '*/*', Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not delete comment');
        }
    };

    const deletePost = async (postId: number): Promise<void> => {
        if (!session) throw new Error('You must be logged in to delete posts');
        if (!session.user.roles.some((role) => ['admin', 'editor'].includes(role.toLowerCase()))) {
            throw new Error('Only editors and administrators can delete posts');
        }
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { accept: '*/*', Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not delete post');
        }
    };

    const updatePost = async (postId: number, input: CreatePostInput): Promise<import('../types').Post> => {
        if (!session) throw new Error('You must be logged in to edit posts');
        if (!session.user.roles.some((role) => ['admin', 'editor'].includes(role.toLowerCase()))) {
            throw new Error('Only editors and administrators can edit posts');
        }
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not update post');
        }
        return response.json() as Promise<import('../types').Post>;
    };

    const reactToPost = async (postId: number, reaction: 'like' | 'dislike') => {
        if (!session) throw new Error('You must be logged in to react to a post');
        const response = await fetch(`${API_URL}/posts/${postId}/${reaction}`, {
            method: 'POST',
            headers: { accept: '*/*', Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || `Could not ${reaction} this post`);
        }
        return response.json() as Promise<{ postId: number; likes: number; dislikes: number }>;
    };

    const createPost = async (input: CreatePostInput): Promise<import('../types').Post> => {
        if (!session) throw new Error('You must be logged in to create posts');
        if (!session.user.roles.some((role) => ['admin', 'editor'].includes(role.toLowerCase()))) {
            throw new Error('Only editors and administrators can create posts');
        }
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.detail || 'Could not create post');
        }
        return response.json() as Promise<import('../types').Post>;
    };

    const value: AuthContextType = {
        user: session?.user ?? null,
        accessToken: session?.access_token ?? null,
        isAuthenticated: !!session,
        login,
        logout,
        updateUser,
        uploadAvatar,
        refreshUser,
        createComment,
        deleteComment,
        deletePost,
        updatePost,
        reactToPost,
        createPost,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};
