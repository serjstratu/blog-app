import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from './NotificationBell';

vi.mock('../../hooks/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('./NotificationDropdown', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="notification-dropdown">
            <button
                type="button"
                data-testid="notification-dropdown-close"
                onClick={onClose}
            >
                Close
            </button>
        </div>
    ),
}));

const mockUseNotifications = vi.mocked(useNotifications);

const renderComponent = (unreadCount = 5) => {
    mockUseNotifications.mockReturnValue({
        unreadCount,
    } as ReturnType<typeof useNotifications>);

    return render(<NotificationBell />);
};

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render notification bell', () => {
            renderComponent();

            expect(screen.getByTestId('notification-center')).toBeInTheDocument();
            expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
        });

        it('should display unread count', () => {
            renderComponent(5);

            expect(screen.getByTestId('notification-badge')).toHaveTextContent('5');
        });

        it('should display 99+ when unread count exceeds 99', () => {
            renderComponent(150);

            expect(screen.getByTestId('notification-badge')).toHaveTextContent('99+');
        });

        it('should not display badge when unread count is zero', () => {
            renderComponent(0);

            expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
        });

        it('should have correct aria-label with unread count', () => {
            renderComponent(5);

            expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-label', 'Notifications, 5 unread');
        });

        it('should have correct aria-label without unread count', () => {
            renderComponent(0);

            expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-label', 'Notifications');
        });

        it('should have aria-expanded false initially', () => {
            renderComponent();

            expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-expanded', 'false');
        });
    });

    describe('dropdown interaction', () => {
        it('should open dropdown when bell is clicked', () => {
            renderComponent();

            fireEvent.click(screen.getByTestId('notification-bell'));

            expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
            expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-expanded', 'true');
        });

        it('should close dropdown when bell is clicked again', () => {
            renderComponent();

            const bell = screen.getByTestId('notification-bell');

            fireEvent.click(bell);
            fireEvent.click(bell);

            expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
            expect(bell).toHaveAttribute('aria-expanded', 'false');
        });

        it('should close dropdown when onClose is called', () => {
            renderComponent();

            fireEvent.click(screen.getByTestId('notification-bell'));
            fireEvent.click(screen.getByTestId('notification-dropdown-close'));

            expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
            expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-expanded', 'false');
        });
    });
});
