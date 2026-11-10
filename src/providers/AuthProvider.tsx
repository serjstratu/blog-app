import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import type {AuthContextType, LoginRequest, LoginResponse, User} from "../features/auth/types/auth.types.ts";
import {authService} from "../features/auth/services/authService.ts";

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

            if (parsedSession.expires_at <= Date.now()) {
                sessionStorage.removeItem(SESSION_KEY);
                return null;
            }

            return parsedSession;
        } catch {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
    });

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

    const logout = () => {
        sessionStorage.removeItem(SESSION_KEY);
        setSession(null);
    };

    const value: AuthContextType = {
        user: session?.user ?? null,
        isAuthenticated: !!session,
        login,
        logout,
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
