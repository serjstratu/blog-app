import type {Comment, Post, User} from './index.ts';

export interface CreatePostInput {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    image: string;
    status: 'draft' | 'published';
    categoryId: number | null;
    tags: string[];
    isFeatured: boolean;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
}

export interface RefreshResponse {
    access_token: string;
    token_type?: string;
    expires_in: number;
    user?: User;
}

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<User>;
    logout: () => Promise<void>;
    updateUser: (updates: Pick<User, 'name' | 'bio' | 'phone'>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    refreshUser: (id: number) => Promise<User>;
    createComment: (postId: number, content: string, parentId?: number | null) => Promise<Comment>;
    deleteComment: (commentId: number) => Promise<void>;
    deletePost: (postId: number) => Promise<void>;
    reactToPost: (postId: number, reaction: 'like' | 'dislike') => Promise<{ likes: number; dislikes: number }>;
    createPost: (input: CreatePostInput) => Promise<Post>;
}
