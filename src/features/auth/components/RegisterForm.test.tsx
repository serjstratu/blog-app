import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterForm from './RegisterForm';

const { mockRegister, mockNavigate } = vi.hoisted(() => ({
    mockRegister: vi.fn(),
    mockNavigate: vi.fn(),
}));

vi.mock('../../../providers/AuthProvider.tsx', () => ({
    useAuth: () => ({ register: mockRegister }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

describe('RegisterForm', () => {
    const onSuccess = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    const fillValidForm = () => {
        fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Alex Johnson' } });
        fireEvent.change(screen.getByTestId('register-username-input'), { target: { value: 'alexj' } });
        fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'alex@example.com' } });
        fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'password123' } });
    };

    it('registers, closes the modal, and navigates to the new user profile', async () => {
        mockRegister.mockResolvedValue({ id: 11 });
        render(<RegisterForm onSuccess={onSuccess} />);
        fillValidForm();
        fireEvent.click(screen.getByTestId('register-submit'));

        await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({
            name: 'Alex Johnson', username: 'alexj', email: 'alex@example.com', password: 'password123',
        }));
        expect(onSuccess).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith('/user/11');
    });

    it('requires all registration fields and an eight character password', async () => {
        render(<RegisterForm onSuccess={onSuccess} />);
        fireEvent.click(screen.getByTestId('register-submit'));

        expect(await screen.findByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Alex' } });
        fireEvent.change(screen.getByTestId('register-username-input'), { target: { value: 'alex' } });
        fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'alex@example.com' } });
        fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: '1234567' } });
        fireEvent.click(screen.getByTestId('register-submit'));

        expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows duplicate username or email errors from the API', async () => {
        mockRegister.mockRejectedValue(new Error('That username or email is already in use'));
        render(<RegisterForm onSuccess={onSuccess} />);
        fillValidForm();
        fireEvent.click(screen.getByTestId('register-submit'));

        expect(await screen.findByTestId('register-server-error')).toHaveTextContent('That username or email is already in use');
        expect(onSuccess).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows a fallback when registration fails with a non-Error', async () => {
        mockRegister.mockRejectedValue('unexpected');
        render(<RegisterForm onSuccess={onSuccess} />);
        fillValidForm();
        fireEvent.click(screen.getByTestId('register-submit'));

        expect(await screen.findByTestId('register-server-error')).toHaveTextContent('Something went wrong');
    });

    it('toggles password visibility', () => {
        render(<RegisterForm onSuccess={onSuccess} />);

        expect(screen.getByTestId('register-password-input')).toHaveAttribute('type', 'password');
        fireEvent.click(screen.getByTestId('register-password-toggle'));
        expect(screen.getByTestId('register-password-input')).toHaveAttribute('type', 'text');
        fireEvent.click(screen.getByTestId('register-password-toggle'));
        expect(screen.getByTestId('register-password-input')).toHaveAttribute('type', 'password');
    });
});
