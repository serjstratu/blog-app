import type {Comment, User} from '../../../types';

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

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<User>;
    logout: () => void;
    updateUser: (updates: Pick<User, 'name' | 'bio' | 'phone'>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    refreshUser: (id: number) => Promise<User>;
    createComment: (postId: number, content: string, parentId?: number | null) => Promise<Comment>;
}
