import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import UserPage from './UserPage';

const {
    mockUseAuth,
    mockRefreshUser,
    mockUpdateUser,
    mockUploadAvatar,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockRefreshUser: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockUploadAvatar: vi.fn(),
}));

vi.mock('../../providers/AuthProvider.tsx', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('./components', () => ({
    UserAvatar: vi.fn(() => (
        <div data-testid="user-avatar" />
    )),
    UserProfileForm: vi.fn(({ onSave, onCancel }) => (
        <div data-testid="user-profile-form">
            <button onClick={() => onSave({ name: 'Updated name' })}>
                Save
            </button>
            <button onClick={onCancel}>
                Cancel
            </button>
        </div>
    )),
}));

vi.mock('../../components/loader/Loader.tsx', () => ({
    default: () => <div data-testid="loader" />,
}));

const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+37360000000',
    bio: 'Software engineer',
    avatar: null,
    roles: ['user'],
    last_login: '2026-11-20T10:00:00Z',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
};

const renderUserPage = (id = '1') => {
    return render(
        <MemoryRouter initialEntries={[`/users/${id}`]}>
            <Routes>
                <Route path="/users/:id" element={<UserPage />} />
                <Route path="/" element={<div data-testid="home-page" />} />
            </Routes>
        </MemoryRouter>
    );
};

describe('UserPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            user: mockUser,
            updateUser: mockUpdateUser,
            uploadAvatar: mockUploadAvatar,
            refreshUser: mockRefreshUser,
        });

        mockRefreshUser.mockResolvedValue(mockUser);
        mockUpdateUser.mockResolvedValue(mockUser);
    });

    it('should display loader while loading profile', () => {
        mockRefreshUser.mockReturnValue(new Promise(() => {}));

        renderUserPage();

        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render user profile after successful loading', async () => {
        renderUserPage();

        expect(await screen.findByTestId('user-profile')).toBeInTheDocument();

        expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
        expect(screen.getByTestId('user-bio')).toHaveTextContent('Software engineer');
        expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
        expect(screen.getByTestId('user-phone')).toHaveTextContent('+37360000000');
        expect(screen.getByTestId('user-roles')).toHaveTextContent('user');
    });

    it('should render account dates', async () => {
        renderUserPage();

        await screen.findByTestId('user-profile');

        expect(screen.getByTestId('user-last-login')).not.toBeEmptyDOMElement();
        expect(screen.getByTestId('user-created-at')).not.toBeEmptyDOMElement();
        expect(screen.getByTestId('user-updated-at')).not.toBeEmptyDOMElement();
    });

    it('should pass uploadAvatar to UserAvatar', async () => {
        renderUserPage();

        await screen.findByTestId('user-profile');

        expect(mockUploadAvatar).not.toHaveBeenCalled();

        expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });
});