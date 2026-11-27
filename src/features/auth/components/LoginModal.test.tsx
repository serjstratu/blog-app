import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginModal from './LoginModal';

vi.mock('./LoginForm', () => ({
    default: ({ onSuccess }: { onSuccess: () => void }) => (
        <button type="button" onClick={onSuccess}>Mock successful login</button>
    ),
}));
vi.mock('./RegisterForm', () => ({
    default: ({ onSuccess }: { onSuccess: () => void }) => (
        <button type="button" onClick={onSuccess}>Mock successful registration</button>
    ),
}));

describe('LoginModal', () => {
    it('renders the accessible modal and its content', () => {
        render(<LoginModal onClose={vi.fn()} />);

        expect(screen.getByTestId('login-modal-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('login-modal')).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
        expect(screen.getByTestId('login-modal-description')).toHaveTextContent('Sign in to your account');
    });

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(<LoginModal onClose={onClose} />);

        fireEvent.click(screen.getByTestId('login-modal-close'));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the overlay is clicked, but not when the modal is clicked', () => {
        const onClose = vi.fn();
        render(<LoginModal onClose={onClose} />);

        fireEvent.click(screen.getByTestId('login-modal'));
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('login-modal-overlay'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes after a successful login callback', () => {
        const onClose = vi.fn();
        render(<LoginModal onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'Mock successful login' }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('switches to registration and can switch back to login', () => {
        render(<LoginModal onClose={vi.fn()} />);

        fireEvent.click(screen.getByTestId('auth-mode-toggle'));
        expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mock successful registration' })).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('auth-mode-toggle'));
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    });

    it('closes after a successful registration callback', () => {
        const onClose = vi.fn();
        render(<LoginModal onClose={onClose} />);
        fireEvent.click(screen.getByTestId('auth-mode-toggle'));
        fireEvent.click(screen.getByRole('button', { name: 'Mock successful registration' }));

        expect(onClose).toHaveBeenCalledOnce();
    });
});
