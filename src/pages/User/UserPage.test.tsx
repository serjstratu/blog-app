import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UserPage from './UserPage';

const { mockUseAuth, mockRefreshUser } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockRefreshUser: vi.fn(),
}));

vi.mock('../../providers/AuthProvider.tsx', () => ({ useAuth: mockUseAuth }));

const CurrentRoute = () => {
    const location = useLocation();
    return <output data-testid="current-route">{location.pathname}</output>;
};

describe('UserPage access control', () => {
    it('redirects guests to home without requesting the profile', async () => {
        mockUseAuth.mockReturnValue({
            user: null,
            updateUser: vi.fn(),
            uploadAvatar: vi.fn(),
            refreshUser: mockRefreshUser,
        });

        render(
            <MemoryRouter initialEntries={['/user/13']}>
                <Routes>
                    <Route path="/user/:id" element={<UserPage />} />
                    <Route path="/" element={<p>Home page</p>} />
                </Routes>
                <CurrentRoute />
            </MemoryRouter>,
        );

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(screen.getByTestId('current-route')).toHaveTextContent('/');
        expect(mockRefreshUser).not.toHaveBeenCalled();
    });
});
