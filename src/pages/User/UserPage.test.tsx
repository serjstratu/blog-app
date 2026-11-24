import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../types';
import { API_ORIGIN } from '../../config';
import UserPage from './UserPage';

const { mockUseAuth, mockRefreshUser, mockUpdateUser, mockUploadAvatar, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(), mockRefreshUser: vi.fn(), mockUpdateUser: vi.fn(), mockUploadAvatar: vi.fn(),
    mockToastError: vi.fn(), mockToastSuccess: vi.fn(),
}));

vi.mock('../../providers/AuthProvider.tsx', () => ({ useAuth: mockUseAuth }));
vi.mock('react-toastify', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

const user: User = {
    id: 11, name: 'Alex Johnson', username: 'alexj', email: 'alex@example.com',
    avatar: '/uploads/alex.webp', bio: 'Frontend developer', phone: '+123456789', roles: ['user'],
    last_login: '2026-11-24T09:00:00Z', created_at: '2026-11-20T09:00:00Z', updated_at: '2026-11-23T09:00:00Z',
};

const CurrentRoute = () => {
    const location = useLocation();
    return <output data-testid="current-route">{location.pathname}</output>;
};

function renderUserPage(id: string | number = user.id) {
    return render(
        <MemoryRouter initialEntries={[`/user/${id}`]}>
            <Routes>
                <Route path="/user/:id" element={<UserPage />} />
                <Route path="/add/" element={<p>Add post page</p>} />
                <Route path="/" element={<p>Home page</p>} />
            </Routes>
            <CurrentRoute />
        </MemoryRouter>,
    );
}

describe('UserPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user, updateUser: mockUpdateUser, uploadAvatar: mockUploadAvatar, refreshUser: mockRefreshUser,
        });
        mockRefreshUser.mockResolvedValue(user);
        mockUpdateUser.mockResolvedValue(undefined);
        mockUploadAvatar.mockResolvedValue(undefined);
    });

    it('redirects guests home without requesting profile data', async () => {
        mockUseAuth.mockReturnValue({ user: null, updateUser: mockUpdateUser, uploadAvatar: mockUploadAvatar, refreshUser: mockRefreshUser });
        renderUserPage(13);

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(screen.getByTestId('current-route')).toHaveTextContent('/');
        expect(mockRefreshUser).not.toHaveBeenCalled();
    });

    it('shows a loader while refreshing the current user profile', async () => {
        let resolveProfile!: (profile: User) => void;
        mockRefreshUser.mockReturnValue(new Promise((resolve) => { resolveProfile = resolve; }));
        renderUserPage();

        expect(screen.getByRole('status', { name: 'Loading profile' })).toBeInTheDocument();
        resolveProfile(user);

        expect(await screen.findByTestId('user-profile')).toBeInTheDocument();
    });

    it('renders refreshed user details, avatar, and formatted dates', async () => {
        const refreshedUser = { ...user, name: 'Alex Updated', phone: null, roles: [] };
        mockRefreshUser.mockResolvedValue(refreshedUser);
        renderUserPage();

        expect(await screen.findByAltText("Alex Updated's avatar")).toBeInTheDocument();
        expect(screen.getByTestId('user-avatar-image')).toHaveAttribute('src', `${API_ORIGIN}/uploads/alex.webp`);
        expect(screen.getByTestId('user-email')).toHaveTextContent(user.email);
        expect(screen.getByTestId('user-phone')).toHaveTextContent('—');
        expect(screen.getByTestId('user-roles')).toHaveTextContent('—');
        expect(screen.getByTestId('user-bio')).toHaveTextContent(user.bio!);
        expect(screen.getByTestId('user-last-login')).toHaveTextContent('24.11.2026 11:00');
        expect(screen.getByTestId('user-created-at')).toHaveTextContent('20.11.2026 11:00');
        expect(screen.getByTestId('user-updated-at')).toHaveTextContent('23.11.2026 11:00');
        expect(mockRefreshUser).toHaveBeenCalledWith(user.id);
    });

    it('allows the owner to edit and save profile details', async () => {
        renderUserPage();
        await screen.findByTestId('user-profile');
        fireEvent.click(screen.getByTestId('edit-profile-button'));
        expect(screen.getByTestId('user-profile-form')).toBeInTheDocument();
        fireEvent.change(screen.getByTestId('user-profile-name'), { target: { value: 'Alex New Name' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({
            name: 'Alex New Name', bio: user.bio, phone: user.phone,
        }));
        expect(screen.queryByTestId('user-profile-form')).not.toBeInTheDocument();
    });

    it('can cancel profile editing without saving', async () => {
        renderUserPage();
        await screen.findByTestId('user-profile');
        fireEvent.click(screen.getByTestId('edit-profile-button'));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByTestId('user-profile-form')).not.toBeInTheDocument();
        expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('redirects to home for an invalid profile id', async () => {
        renderUserPage('invalid');

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mockRefreshUser).not.toHaveBeenCalled();
    });

    it('shows a toast and redirects when profile loading fails with an Error', async () => {
        mockRefreshUser.mockRejectedValue(new Error('Profile unavailable'));
        renderUserPage(13);

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mockToastError).toHaveBeenCalledWith('Profile unavailable');
    });

    it('shows a fallback toast when profile loading fails with an unknown cause', async () => {
        mockRefreshUser.mockRejectedValue('unexpected');
        renderUserPage(13);

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mockToastError).toHaveBeenCalledWith('Could not load profile');
    });

    it('does not update state when profile loading finishes after unmount', async () => {
        let resolveProfile!: (profile: User) => void;
        mockRefreshUser.mockReturnValue(new Promise((resolve) => { resolveProfile = resolve; }));
        const { unmount } = renderUserPage(13);
        unmount();
        resolveProfile({ ...user, id: 13, name: 'Other User' });
        await waitFor(() => expect(mockRefreshUser).toHaveBeenCalledWith(13));
    });

    it('ignores profile errors when the page unmounts before the request rejects', async () => {
        let rejectProfile!: (reason: unknown) => void;
        mockRefreshUser.mockReturnValue(new Promise((_resolve, reject) => { rejectProfile = reject; }));
        const { unmount } = renderUserPage(13);
        unmount();
        rejectProfile(new Error('late profile failure'));
        await waitFor(() => expect(mockRefreshUser).toHaveBeenCalledWith(13));

        expect(mockToastError).not.toHaveBeenCalled();
    });

    it('allows admins and editors to create posts from their profile', async () => {
        mockUseAuth.mockReturnValue({
            user: { ...user, roles: ['editor'] }, updateUser: mockUpdateUser,
            uploadAvatar: mockUploadAvatar, refreshUser: mockRefreshUser,
        });
        renderUserPage();

        fireEvent.click(await screen.findByTestId('create-post-link'));
        expect(await screen.findByText('Add post page')).toBeInTheDocument();
    });

    it('does not expose profile editing when viewing another user', async () => {
        mockRefreshUser.mockResolvedValue({ ...user, id: 13, name: 'Another User' });
        renderUserPage(13);

        expect(await screen.findByAltText("Another User's avatar")).toBeInTheDocument();
        expect(screen.queryByTestId('edit-profile-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('user-profile-form')).not.toBeInTheDocument();
    });

    it('passes avatar uploads through the auth provider', async () => {
        renderUserPage();
        await screen.findByTestId('user-profile');
        const image = new File(['avatar'], 'avatar.png', { type: 'image/png' });
        fireEvent.change(screen.getByTestId('user-avatar-input'), { target: { files: [image] } });

        await waitFor(() => expect(mockUploadAvatar).toHaveBeenCalledWith(image));
    });
});
