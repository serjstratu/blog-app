import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LoginForm from './LoginForm';

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockNavigate: vi.fn(),
}));

vi.mock('../../../providers/AuthProvider.tsx', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('LoginForm', () => {
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderLoginForm = () =>
        render(<LoginForm onSuccess={mockOnSuccess} />);

    describe('Password visibility', () => {
        it('should hide password by default', () => {
            renderLoginForm();

            expect(screen.getByTestId('password-input'))
                .toHaveAttribute('type', 'password');

            expect(screen.getByTestId('password-toggle'))
                .toHaveAttribute('aria-label', 'Show password');
        });

        it('should show password when toggle is clicked', () => {
            renderLoginForm();

            fireEvent.click(screen.getByTestId('password-toggle'));

            expect(screen.getByTestId('password-input'))
                .toHaveAttribute('type', 'text');

            expect(screen.getByTestId('password-toggle'))
                .toHaveAttribute('aria-label', 'Hide password');
        });

        it('should hide password when toggle is clicked again', () => {
            renderLoginForm();

            const toggle = screen.getByTestId('password-toggle');
            const passwordInput = screen.getByTestId('password-input');

            fireEvent.click(toggle);
            fireEvent.click(toggle);

            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('should preserve password value when toggling visibility', () => {
            renderLoginForm();

            const passwordInput = screen.getByTestId('password-input');
            const password = 'MySecretPassword123!';

            fireEvent.change(passwordInput, {
                target: { value: password },
            });

            fireEvent.click(screen.getByTestId('password-toggle'));

            expect(passwordInput).toHaveValue(password);

            fireEvent.click(screen.getByTestId('password-toggle'));

            expect(passwordInput).toHaveValue(password);
        });

        it('should not submit the form when toggle is clicked', () => {
            renderLoginForm();

            const toggle = screen.getByTestId('password-toggle');

            expect(toggle).toHaveAttribute('type', 'button');

            fireEvent.click(toggle);

            expect(mockLogin).not.toHaveBeenCalled();
            expect(mockOnSuccess).not.toHaveBeenCalled();
        });
    });
});
