import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LoginForm from './LoginForm';

const { mockLogin, mockRegister, mockNavigate } = vi.hoisted(() => ({
    mockLogin: vi.fn(), mockRegister: vi.fn(),
    mockNavigate: vi.fn(),
}));

vi.mock('../../../providers/AuthProvider.tsx', () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister,
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

    describe('Form submission', () => {
        it('logs in, closes the modal, and navigates to the returned user profile', async () => {
            mockLogin.mockResolvedValue({ id: 42, name: 'Alex' });
            renderLoginForm();
            fireEvent.change(screen.getByTestId('login-input'), { target: { value: 'alex@example.com' } });
            fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'secret123' } });
            fireEvent.click(screen.getByTestId('login-submit'));

            await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({
                login: 'alex@example.com', password: 'secret123',
            }));
            expect(mockOnSuccess).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith('/user/42');
        });

        it('shows an Error message when authentication fails', async () => {
            mockLogin.mockRejectedValue(new Error('Invalid credentials'));
            renderLoginForm();
            fireEvent.change(screen.getByTestId('login-input'), { target: { value: 'alexj' } });
            fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'secret123' } });
            fireEvent.click(screen.getByTestId('login-submit'));

            expect(await screen.findByTestId('login-server-error')).toHaveTextContent('Invalid credentials');
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('shows a fallback message when authentication rejects with a non-Error', async () => {
            mockLogin.mockRejectedValue('unexpected');
            renderLoginForm();
            fireEvent.change(screen.getByTestId('login-input'), { target: { value: 'alexj' } });
            fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'secret123' } });
            fireEvent.click(screen.getByTestId('login-submit'));

            expect(await screen.findByTestId('login-server-error')).toHaveTextContent('Something went wrong');
        });

        it('validates required login and password before calling auth', async () => {
            renderLoginForm();
            fireEvent.click(screen.getByTestId('login-submit'));

            expect(await screen.findByText('Login is required')).toBeInTheDocument();
            expect(screen.getByText('Password is required')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('rejects passwords shorter than six characters', async () => {
            renderLoginForm();
            fireEvent.change(screen.getByTestId('login-input'), { target: { value: 'alexj' } });
            fireEvent.change(screen.getByTestId('password-input'), { target: { value: '12345' } });
            fireEvent.click(screen.getByTestId('login-submit'));

            expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('disables the submit button while login is pending', async () => {
            let resolveLogin!: (value: { id: number }) => void;
            mockLogin.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
            renderLoginForm();
            fireEvent.change(screen.getByTestId('login-input'), { target: { value: 'alexj' } });
            fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'secret123' } });
            fireEvent.click(screen.getByTestId('login-submit'));

            expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
            resolveLogin({ id: 42 });

            await waitFor(() => expect(screen.getByTestId('login-submit')).toBeEnabled());
        });
    });
});
