export interface LoginRequest {
    login: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar?: string | null;
    bio?: string | null;
    phone: string | null;
    roles: string[];
    last_login: string | null;
    created_at: string;
    updated_at: string;
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
}
