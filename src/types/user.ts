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