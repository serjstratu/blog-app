import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import App from './App';

vi.mock('./providers/AuthProvider.tsx', () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="auth-provider">{children}</div>
    ),
}));

vi.mock('./providers/AppRouter.tsx', () => ({
    default: () => <div data-testid="app-router">Router content</div>,
}));

describe('App', () => {
    it('should render AppRouter inside AuthProvider', () => {
        render(<App />);

        const authProvider = screen.getByTestId('auth-provider');
        const appRouter = screen.getByTestId('app-router');

        expect(authProvider).toBeInTheDocument();
        expect(appRouter).toBeInTheDocument();
        expect(authProvider).toContainElement(appRouter);
    });
});