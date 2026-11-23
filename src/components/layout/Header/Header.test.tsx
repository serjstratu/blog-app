import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';

import Header from './Header';

const { mockUseAuth, mockLogout } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockLogout: vi.fn(),
}));

vi.mock('../../../providers/AuthProvider', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../../features/auth/components/LoginModal', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div role="dialog" aria-label="Login modal">
            <button onClick={onClose}>Close modal</button>
        </div>
    ),
}));

vi.mock('../../notifications/NotificationBell', () => ({
    default: () => <div data-testid="notification-bell" />,
}));

vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
    },
}));

const renderHeader = (initialRoute = '/') => {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <Header />
            <CurrentRoute />
        </MemoryRouter>,
    );
};

const CurrentRoute = () => {
    const location = useLocation();
    return <output data-testid="current-route">{location.pathname}</output>;
};

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            user: null,
            logout: mockLogout,
        });
    });

    describe('Rendering', () => {
        it('should render the logo', () => {
            renderHeader();

            expect(screen.getByText('Blog App')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /blog app/i }))
                .toHaveAttribute('href', '/');
        });

        it('should render navigation links', () => {
            renderHeader();

            expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
        });

        it('should mark the current route as active', () => {
            renderHeader('/blog');

            expect(screen.getByRole('link', { name: 'Blog' }))
                .toHaveClass('active');

            expect(screen.getByRole('link', { name: 'Home' }))
                .not.toHaveClass('active');
        });
    });

    describe('Guest user', () => {
        it('should display Login button', () => {
            renderHeader();

            expect(screen.getByRole('button', { name: 'Login' }))
                .toBeInTheDocument();

            expect(screen.queryByTestId('notification-bell'))
                .not.toBeInTheDocument();
        });

        it('should open LoginModal when Login is clicked', () => {
            renderHeader();

            fireEvent.click(screen.getByRole('button', { name: 'Login' }));

            expect(screen.getByRole('dialog', { name: 'Login modal' }))
                .toBeInTheDocument();
        });

        it('should close LoginModal when onClose is called', () => {
            renderHeader();

            fireEvent.click(screen.getByRole('button', { name: 'Login' }));
            fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    describe('Authenticated user', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                user: {
                    id: 1,
                    name: 'John Doe',
                    roles: ['user'],
                },
                logout: mockLogout,
            });
        });

        it('should display user information', () => {
            renderHeader();

            expect(screen.getByRole('link', { name: 'John Doe' }))
                .toHaveAttribute('href', '/user/1');

            expect(screen.getByTestId('notification-bell'))
                .toBeInTheDocument();

            expect(screen.getByRole('button', { name: 'Logout' }))
                .toBeInTheDocument();

            expect(screen.queryByRole('button', { name: 'Login' }))
                .not.toBeInTheDocument();

            expect(screen.queryByRole('link', { name: 'Dashboard' }))
                .not.toBeInTheDocument();
        });

        it('should display the dashboard link for administrators', () => {
            mockUseAuth.mockReturnValue({
                user: { id: 1, name: 'Admin User', roles: ['admin'] },
                logout: mockLogout,
            });

            renderHeader();

            expect(screen.getByRole('link', { name: 'Dashboard' }))
                .toHaveAttribute('href', '/dashboard');
        });

        it('should call logout when Logout is clicked', async () => {
            mockLogout.mockResolvedValue(undefined);

            renderHeader();

            fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalledOnce();
            });
        });

        it('should navigate to the home page after logout', async () => {
            mockLogout.mockResolvedValue(undefined);

            renderHeader('/user/1');
            fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

            await waitFor(() => {
                expect(screen.getByTestId('current-route')).toHaveTextContent('/');
            });
        });

        it('should display error toast when logout fails', async () => {
            mockLogout.mockRejectedValue(new Error('Logout failed'));

            renderHeader();

            fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Logout failed');
                expect(screen.getByTestId('current-route')).toHaveTextContent('/');
            });
        });

        it('should display fallback error when logout rejects with non-Error', async () => {
            mockLogout.mockRejectedValue('Unexpected error');

            renderHeader();

            fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Could not log out');
            });
        });
    });

    describe('Mobile navigation', () => {
        it('should open and close the navigation menu', () => {
            renderHeader();

            const toggleButton = screen.getByRole('button', {
                name: 'Open navigation menu',
            });

            const navigation = screen.getByRole('navigation');

            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

            fireEvent.click(toggleButton);

            expect(navigation).toHaveClass('header__nav--open');

            expect(screen.getByRole('button', {
                name: 'Close navigation menu',
            })).toHaveAttribute('aria-expanded', 'true');

            fireEvent.click(screen.getByRole('button', {
                name: 'Close navigation menu',
            }));

            expect(navigation).not.toHaveClass('header__nav--open');
        });

        it('should close navigation menu after clicking a navigation link', () => {
            renderHeader();

            fireEvent.click(screen.getByRole('button', {
                name: 'Open navigation menu',
            }));

            const navigation = screen.getByRole('navigation');

            expect(navigation).toHaveClass('header__nav--open');

            fireEvent.click(screen.getByRole('link', { name: 'Blog' }));

            expect(navigation).not.toHaveClass('header__nav--open');
        });

        it('should close navigation menu after clicking the logo', () => {
            renderHeader();

            fireEvent.click(screen.getByRole('button', {
                name: 'Open navigation menu',
            }));

            fireEvent.click(screen.getByRole('link', { name: /blog app/i }));

            expect(screen.getByRole('navigation'))
                .not.toHaveClass('header__nav--open');
        });
    });
});
